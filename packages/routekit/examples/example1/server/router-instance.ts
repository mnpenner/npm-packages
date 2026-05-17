import { empty, head as responseHead, ok, Router, text } from '@mpen/routekit'
import { withZod } from '@mpen/routekit/routes'
import { z } from 'zod'
import { CommonHeaders, CommonContentTypes, HttpStatus } from '@mpen/http'

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
        handler: () => ok({ message: 'Hello World!' }),
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
        handler: () => ok({ message: 'Hello World!' }),
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
        handler: () => ok({ message: 'Hello World!' }),
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
        handler: () => ok({ message: 'Hello World!' }),
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
            ok({
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
        handler: () => ok({ message: 'Hello Json Helper!' }),
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
        handler: ({ params }) => ok({ ok: true, tag: params.body.tag }),
    }),
)

router.get('/health', () => text('ok'))

router.head('/health', () => empty(HttpStatus.OK))

router.post('/submit', () => text('submitted'))

router.put('/items/:id', () => text('updated'))

router.delete('/items/:id', () => text('deleted'))

router.patch('/items/:id', () => text('patched'))

function sleep(ms: number): Promise<void> {
    return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

router.add({
    path: '/gen',
    handler: async function* () {
        // console.log('start')
        yield responseHead(HttpStatus.OK, {
            'x-foo': 'bar',
            'x-bar': 'baz',
            [CommonHeaders.CONTENT_TYPE]: CommonContentTypes.PLAIN_TEXT,
        })
        // console.log('headers yielded')
        await sleep(1000)
        yield
        // console.log('sleep done')
        return 'herro'
    },
})

if (import.meta.main) {
    console.dir(router.getRoutes(), { depth: 10 })
}

export default router
