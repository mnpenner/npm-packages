import {Router} from '../src/index'
import {zodRoute} from '../src/helpers/zod'
import {jsonResponse} from '../src/response/simple'
import {z} from 'zod'
import {CommonHeaders, CommonContentTypes, HttpMethod, HttpStatus} from '@mpen/http-helpers'

export const router = new Router()
const helloResponseSchema = z.object({message: z.string()})

router.add(zodRoute({
    path: '/',
    method: HttpMethod.GET,
    schema: {
        response: {
            body: {
                200: helloResponseSchema,
            },
        },
    },
    handler: () => jsonResponse({message: 'Hello World!'}),
}))

router.add(zodRoute({
    name: 'namedRoute',
    path: '/name/bar',
    method: HttpMethod.GET,
    schema: {
        response: {
            body: {
                200: helloResponseSchema,
            },
        },
    },
    handler: () => jsonResponse({message: 'Hello World!'}),
}))

router.add(zodRoute({
    name: 'namedRoute',
    path: '/name/bar',
    method: HttpMethod.POST,
    schema: {
        response: {
            body: {
                200: helloResponseSchema,
            },
        },
    },
    handler: () => jsonResponse({message: 'Hello World!'}),
}))

router.add(zodRoute({
    name: 'foo.bar',
    path: '/foo/bar',
    method: HttpMethod.POST,
    schema: {
        response: {
            body: {
                200: helloResponseSchema,
            },
        },
    },
    handler: () => jsonResponse({message: 'Hello World!'}),
}))

router.add(zodRoute({
    path: '/books/:id',
    method: HttpMethod.POST,
    schema: {
        request: {
            path: z.object({id: z.coerce.number().int()}),
            body: z.object({title: z.string(), author: z.string()}),
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
    handler: ({pathParams, body}) => jsonResponse({
        id: pathParams.id,
        title: body.title,
        author: body.author,
    }),
}))

router.add(zodRoute({
    name: 'jsonHelper',
    path: '/json-helper',
    method: HttpMethod.GET,
    schema: {
        response: {
            body: {
                200: z.object({message: z.string()}),
            },
        },
    },
    handler: () => jsonResponse({message: 'Hello Json Helper!'}),
}))

router.add(zodRoute({
    name: 'jsonHelperZod',
    path: '/json-helper-zod',
    method: HttpMethod.POST,
    schema: {
        request: {
            body: z.object({tag: z.string()}),
        },
        response: {
            body: {
                200: z.object({ok: z.boolean(), tag: z.string()}),
            },
        },
    },
    handler: ({body}) => jsonResponse({ok: true, tag: body.tag}),
}))

router.get('/health', () => new Response('ok'))

router.head('/health', () => new Response(null))

router.post('/submit', () => new Response('submitted'))

router.put('/items/:id', () => new Response('updated'))

router.delete('/items/:id', () => new Response('deleted'))

router.patch('/items/:id', () => new Response('patched'))

function sleep(ms: number): Promise<void> {
    return new Promise<void>(resolve => setTimeout(resolve, ms))
}

router.add({
    path: '/gen',
    // method: HttpMethod.GET,
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
    }
})

if(import.meta.main) {
    console.dir(router.getRoutes(),{depth: 10})
}

export default router
