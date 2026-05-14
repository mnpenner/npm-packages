import { Router, jsonResponse } from '@mpen/server-router'
import { withZod } from '@mpen/server-router/routes'
import { z } from 'zod'
import { CommonHeaders, CommonContentTypes, HttpStatus } from '@mpen/http-helpers'

export const router = new Router()
const helloResponseSchema = z.object({ message: z.string() })

router.get(
    '/',
    withZod({
        schema: {
            response: {
                body: {
                    200: helloResponseSchema,
                },
            },
        },
        handler: () => jsonResponse({ message: 'Hello World!' }),
    }),
)

router.get(
    '/name/bar',
    withZod({
        name: 'namedRoute',
        schema: {
            response: {
                body: {
                    200: helloResponseSchema,
                },
            },
        },
        handler: () => jsonResponse({ message: 'Hello World!' }),
    }),
)

router.post(
    '/name/bar',
    withZod({
        name: 'namedRoute',
        schema: {
            response: {
                body: {
                    200: helloResponseSchema,
                },
            },
        },
        handler: () => jsonResponse({ message: 'Hello World!' }),
    }),
)

router.post(
    '/foo/bar',
    withZod({
        name: 'foo.bar',
        schema: {
            response: {
                body: {
                    200: helloResponseSchema,
                },
            },
        },
        handler: () => jsonResponse({ message: 'Hello World!' }),
    }),
)

router.post(
    '/books/:id',
    withZod({
        schema: {
            request: {
                path: z.object({ id: z.coerce.number().int() }),
                body: z.object({ title: z.string(), author: z.string() }),
            },
            response: {
                body: {
                    200: z.object({
                        id: z.number().int(),
                        title: z.string(),
                        author: z.string(),
                    }),
                },
            },
        },
        handler: ({ params }) =>
            jsonResponse({
                id: params.path.id,
                title: params.body.title,
                author: params.body.author,
            }),
    }),
)

router.get(
    '/json-helper',
    withZod({
        name: 'jsonHelper',
        schema: {
            response: {
                body: {
                    200: z.object({ message: z.string() }),
                },
            },
        },
        handler: () => jsonResponse({ message: 'Hello Json Helper!' }),
    }),
)

router.post(
    '/json-helper-zod',
    withZod({
        name: 'jsonHelperZod',
        schema: {
            request: {
                body: z.object({ tag: z.string() }),
            },
            response: {
                body: {
                    200: z.object({ ok: z.boolean(), tag: z.string() }),
                },
            },
        },
        handler: ({ params }) => jsonResponse({ ok: true, tag: params.body.tag }),
    }),
)

router.get('/health', () => new Response('ok'))

router.head('/health', () => new Response(null))

router.post('/submit', () => new Response('submitted'))

router.put('/items/:id', () => new Response('updated'))

router.delete('/items/:id', () => new Response('deleted'))

router.patch('/items/:id', () => new Response('patched'))

function sleep(ms: number): Promise<void> {
    return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

router.add({
    path: '/gen',
    handler: async function* () {
        // console.log('start')
        yield HttpStatus.OK
        // console.log('ok yielded')
        yield new Headers({
            'x-foo': 'bar',
            'x-bar': 'baz',
            [CommonHeaders.CONTENT_TYPE]: CommonContentTypes.PLAIN_TEXT,
        })
        // console.log('headers yielded')
        await sleep(1000)
        yield
        // console.log('sleep done')
        return new TextEncoder().encode('herro')
    },
})

if (import.meta.main) {
    console.dir(router.getRoutes(), { depth: 10 })
}

export default router
