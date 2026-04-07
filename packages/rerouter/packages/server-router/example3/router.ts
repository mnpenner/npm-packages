import {CommonContentTypes, HttpMethod, HttpStatus} from '@mpen/http-helpers'
import {Router, type ContextMiddleware} from '../src'
import {ValidationError, ZodRouteFactory} from '../src/helpers/zod'
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
    return accept.includes(CommonContentTypes.YAML)
        || accept.includes('application/yaml')
        || accept.includes('application/x-yaml')
        || accept.includes('text/yaml')
}

function toYaml(value: unknown): string {
    return Bun.YAML.stringify(value, null, 2)
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

const factory = new ZodRouteFactory({
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
})

router.add(factory.route({
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
                [HttpStatus.OK]: z.object({
                    id: z.number().int(),
                    name: z.string(),
                    view: z.enum(['summary', 'full']),
                    tags: z.array(z.string()),
                    summary: z.string(),
                }),
                [HttpStatus.BAD_REQUEST]: validationErrorSchema,
            },
        },
    },
    handler: ({params}) => ({
        id: params.path.id,
        name: params.body.name,
        view: params.query.view,
        tags: params.body.tags,
        summary: params.query.view === 'full'
            ? `Widget ${params.path.id}: ${params.body.name} (${params.body.tags.length} tag(s))`
            : params.body.name,
    }),
}))

export default router
