import {Router} from '../src/index'
import {createZodNeverjectHandler} from 'experimental/server-router-zod-neverject'
import {okAsync} from 'neverject'
import {z} from 'zod'
import {CommonHeaders, CommonContentTypes, HttpMethod, HttpStatus} from '@mpen/http-helpers'

export const router = new Router()

router.add({
    pattern: '/',
    handler: createZodNeverjectHandler({
        exec: (req) => okAsync({
            body: { message: 'Hello World!' }
        })
    }),
    method: HttpMethod.GET
})

router.add({
    name: 'namedRoute',
    pattern: '/name/bar',
    handler: createZodNeverjectHandler({
        exec: (req) => okAsync({
            body: { message: 'Hello World!' }
        })
    }),
    method: HttpMethod.GET
})

router.add({
    name: 'namedRoute',
    pattern: '/name/bar',
    handler: createZodNeverjectHandler({
        exec: (req) => okAsync({
            body: { message: 'Hello World!' }
        })
    }),
    method: HttpMethod.POST
})

router.add({
    name: 'foo.bar',
    pattern: '/foo/bar',
    handler: createZodNeverjectHandler({
        exec: (req) => okAsync({
            body: { message: 'Hello World!' }
        })
    }),
    method: HttpMethod.POST
})


router.add({
    pattern: '/books/:id',
    handler: createZodNeverjectHandler({
        path: z.object({ id: z.string() }),
        body: z.object({ title: z.string(), author: z.string() }),
        exec: (req) => okAsync({
            body: {
                id: req.pathParams.id,
                title: req.body.title,
                author: req.body.author
            }
        })
    }),
    method: HttpMethod.POST
})

function sleep(ms: number): Promise<void> {
    return new Promise<void>(resolve => setTimeout(resolve, ms))
}

router.add({
    pattern: '/gen',
    // method: HttpMethod.GET,
    handler: async function* ({req}) {
        console.log('start')
        yield HttpStatus.OK
        console.log('ok yielded')
        yield new Headers({
            'x-foo': 'bar',
            'x-bar': 'baz',
            [CommonHeaders.CONTENT_TYPE]: CommonContentTypes.PLAIN_TEXT,
        })
        console.log('headers yielded')
        await sleep(1000)
        yield
        console.log('sleep done')
        return new TextEncoder().encode('herro')
    }
})

if(import.meta.main) {
    console.log(router)
}
