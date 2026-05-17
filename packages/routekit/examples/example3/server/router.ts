import { CommonContentTypes, HttpStatus } from '@mpen/http'
import { jsonSerializer, response, Router, type BodySerializer } from '@mpen/routekit'
import { createZodRoutes, ValidationError } from '@mpen/routekit/routes'
import { z } from 'zod'

const validationErrorSchema = z.object({
    component: z.enum(['request_body', 'url_path', 'query_parameters']),
    message: z.string(),
})

const yamlSerializer: BodySerializer<unknown> = {
    mediaTypes: [CommonContentTypes.YAML, 'application/yaml', 'application/x-yaml', 'text/yaml'],
    canSerialize: () => true,
    serialize: (value) => Bun.YAML.stringify(value, null, 2),
}

export const router = new Router({
    serializers: [jsonSerializer(), yamlSerializer],
})

const zodRoutes = createZodRoutes({
    schema: {
        response: {
            body: {
                [HttpStatus.BAD_REQUEST]: validationErrorSchema,
            },
        },
    },
    validationError(component, error) {
        const componentName =
            component === ValidationError.REQUEST_BODY
                ? 'request_body'
                : component === ValidationError.URL_PATH
                  ? 'url_path'
                  : 'query_parameters'
        return response(
            {
                component: componentName,
                message: z.prettifyError(error),
            },
            { status: HttpStatus.BAD_REQUEST },
        )
    },
})

router.post(
    '/widgets/:id',
    zodRoutes({
        name: 'widgets.byId',
        schema: {
            request: {
                path: z.object({ id: z.coerce.number().int().positive() }),
                query: z.object({ view: z.enum(['summary', 'full']) }),
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
                },
            },
        },
        handler: ({ params }) => ({
            id: params.path.id,
            name: params.body.name,
            view: params.query.view,
            tags: params.body.tags,
            summary:
                params.query.view === 'full'
                    ? `Widget ${params.path.id}: ${params.body.name} (${params.body.tags.length} tag(s))`
                    : params.body.name,
        }),
    }),
)

export default router

// console.dir(router.getRoutes(),{depth: 10})
