import {Router, type Handler} from '../src/index'
import {zodRoute} from '../src/routes/zod'
import {jsonResponse} from '../src/response/simple'
import {z} from 'zod'
import {CommonHeaders, CommonContentTypes, HttpMethod, HttpStatus} from '@mpen/http-helpers'

const router = new Router()

router.add(zodRoute({
    pattern: '/',
    handler: () => new Response(JSON.stringify({message: 'Hello World!'}), {
        headers: {[CommonHeaders.CONTENT_TYPE]: CommonContentTypes.JSON},
    }),
    method: HttpMethod.GET,
}))

router.add(zodRoute({
    name: 'namedRoute',
    pattern: '/name/bar',
    handler: () => new Response(JSON.stringify({message: 'Hello World!'}), {
        headers: {[CommonHeaders.CONTENT_TYPE]: CommonContentTypes.JSON},
    }),
    method: HttpMethod.GET,
}))

router.add(zodRoute({
    name: 'namedRoute',
    pattern: '/name/bar',
    handler: () => new Response(JSON.stringify({message: 'Hello World!'}), {
        headers: {[CommonHeaders.CONTENT_TYPE]: CommonContentTypes.JSON},
    }),
    method: HttpMethod.POST,
}))

router.add(zodRoute({
    name: 'foo.bar',
    pattern: '/foo/bar',
    handler: () => new Response(JSON.stringify({message: 'Hello World!'}), {
        headers: {[CommonHeaders.CONTENT_TYPE]: CommonContentTypes.JSON},
    }),
    method: HttpMethod.POST,
}))

router.add(zodRoute({
    pattern: '/books/:id',
    pathParams: z.object({id: z.coerce.number().int()}),
    body: z.object({title: z.string(), author: z.string()}),
    handler: ({pathParams, body}) => new Response(JSON.stringify({
        id: pathParams.id,
        title: body.title,
        author: body.author,
    }), {
        headers: {[CommonHeaders.CONTENT_TYPE]: CommonContentTypes.JSON},
    }),
    method: HttpMethod.POST,
}))

router.add({
    name: 'jsonHelper',
    pattern: '/json-helper',
    handler: () => jsonResponse({message: 'Hello Json Helper!'}),
    method: HttpMethod.GET,
})

router.add(zodRoute({
    name: 'jsonHelperZod',
    pattern: '/json-helper-zod',
    body: z.object({tag: z.string()}),
    handler: ({body}) => jsonResponse({ok: true, tag: body.tag}),
    method: HttpMethod.POST,
}))

function sleep(ms: number): Promise<void> {
    return new Promise<void>(resolve => setTimeout(resolve, ms))
}

router.add({
    pattern: '/gen',
    // method: HttpMethod.GET,
    handler: async function* ({req}) {
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
    console.log(router)
}

export default router
