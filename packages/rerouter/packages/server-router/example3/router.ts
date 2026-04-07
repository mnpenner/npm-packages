import {CommonContentTypes, HttpMethod, HttpStatus} from '@mpen/http-helpers'
import {Router, type ContextMiddleware} from '../src'
import {ValidationError, zodRoute} from '../src/helpers/zod'
import {z} from 'zod'

type StructuredBody = Record<string, unknown> | unknown[]
type StructuredResult = StructuredBody | {status: number; body: StructuredBody}

const validationErrorSchema = z.object({
    component: z.enum(['request_body', 'url_path', 'query_parameters']),
    message: z.string(),
})

function isStructuredResult(value: unknown): value is StructuredBody {
    return Array.isArray(value) || (!!value && typeof value === 'object')
}

function isResultEnvelope(value: unknown): value is {status: number; body: StructuredBody} {
    return !!value
        && typeof value === 'object'
        && 'status' in value
        && typeof (value as {status: unknown}).status === 'number'
        && 'body' in value
        && isStructuredResult((value as {body: unknown}).body)
}

function isYamlPreferred(request: Request): boolean {
    const accept = request.headers.get('accept') ?? '*/*'
    return accept.includes(CommonContentTypes.YAML) || accept.includes('application/yaml') || accept.includes('text/yaml')
}

function formatYamlScalar(value: unknown): string {
    if (value === null) return 'null'
    if (typeof value === 'string') {
        return /^[A-Za-z0-9 _./:()!-]+$/.test(value) ? value : JSON.stringify(value)
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
        return String(value)
    }
    return JSON.stringify(value)
}

function toYaml(value: unknown, indent = 0): string {
    const prefix = ' '.repeat(indent)
    if (Array.isArray(value)) {
        if (value.length === 0) return `${prefix}[]`
        return value.map(item => {
            if (item === null || typeof item !== 'object' || Array.isArray(item) === false && Object.keys(item as object).length === 0) {
                return `${prefix}- ${formatYamlScalar(item)}`
            }
            return `${prefix}-\n${toYaml(item, indent + 2)}`
        }).join('\n')
    }
    if (value && typeof value === 'object') {
        const entries = Object.entries(value)
        if (entries.length === 0) return `${prefix}{}`
        return entries.map(([key, child]) => {
            if (child === null || typeof child !== 'object') {
                return `${prefix}${key}: ${formatYamlScalar(child)}`
            }
            if (Array.isArray(child) && child.length === 0) {
                return `${prefix}${key}: []`
            }
            return `${prefix}${key}:\n${toYaml(child, indent + 2)}`
        }).join('\n')
    }
    return `${prefix}${formatYamlScalar(value)}`
}

const structuredResponse: ContextMiddleware = async (ctx, next) => {
    const result = await next()
    if (
        result instanceof Response
        || result instanceof ReadableStream
        || typeof result === 'string'
        || result instanceof Uint8Array
        || (typeof Buffer !== 'undefined' && result instanceof Buffer)
        || (!!result && typeof result === 'object' && Symbol.asyncIterator in result)
    ) {
        return result
    }
    if (!isStructuredResult(result) && !isResultEnvelope(result)) {
        return result
    }

    const status = isResultEnvelope(result) ? result.status : HttpStatus.OK
    const body = isResultEnvelope(result) ? result.body : result
    const asYaml = isYamlPreferred(ctx.req)
    return new Response(asYaml ? toYaml(body) : JSON.stringify(body), {
        status,
        headers: {
            'content-type': asYaml ? CommonContentTypes.YAML : CommonContentTypes.JSON,
        },
    })
}

export const router = new Router()
    .use(structuredResponse)

router.add(zodRoute({
    name: 'widgets.byId',
    path: '/widgets/:id',
    method: HttpMethod.POST,
    schema: {
        request: {
            path: z.object({id: z.coerce.number().int().positive()}),
            query: z.object({view: z.enum(['summary', 'full'])}),
            body: z.object({
                name: z.string().min(1),
                tags: z.array(z.string()).default([]),
            }),
        },
        response: {
            body: {
                200: z.object({
                    id: z.number().int(),
                    name: z.string(),
                    view: z.enum(['summary', 'full']),
                    tags: z.array(z.string()),
                    summary: z.string(),
                }),
                400: validationErrorSchema,
            },
        },
    },
    validationError(component, error) {
        const componentName = component === ValidationError.REQUEST_BODY
            ? 'request_body'
            : component === ValidationError.URL_PATH
                ? 'url_path'
                : 'query_parameters'
        return {
            status: HttpStatus.BAD_REQUEST,
            body: {
                component: componentName,
                message: z.prettifyError(error),
            },
        }
    },
    handler: ({pathParams, query, body}) => ({
        id: pathParams.id,
        name: body.name,
        view: query.view,
        tags: body.tags,
        summary: query.view === 'full'
            ? `Widget ${pathParams.id}: ${body.name} (${body.tags.length} tag(s))`
            : body.name,
    }),
}))

export default router
