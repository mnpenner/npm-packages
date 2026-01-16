import {Router} from '../src/index'
import {createZodNeverjectHandler} from '@mpen/server-router-zod-neverject'
import {okAsync} from 'neverject'
import {z} from 'zod'
import {CommonHeaders, ContentTypes, HttpStatus} from '@mpen/http-helpers'

export const router = new Router()

router.add({
    pattern: '/',
    handler: createZodNeverjectHandler({
        exec: (req) => okAsync({
            body: { message: 'Hello World!' }
        })
    }),
    method: 'GET'
})

router.add({
    name: 'namedRoute',
    pattern: '/name/bar',
    handler: createZodNeverjectHandler({
        exec: (req) => okAsync({
            body: { message: 'Hello World!' }
        })
    }),
    method: 'GET'
})

router.add({
    name: 'namedRoute',
    pattern: '/name/bar',
    handler: createZodNeverjectHandler({
        exec: (req) => okAsync({
            body: { message: 'Hello World!' }
        })
    }),
    method: 'POST'
})

router.add({
    name: 'foo.bar',
    pattern: '/foo/bar',
    handler: createZodNeverjectHandler({
        exec: (req) => okAsync({
            body: { message: 'Hello World!' }
        })
    }),
    method: 'POST'
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
    method: 'POST'
})

const sleep = (ms: number): Promise<void> =>
    new Promise<void>(resolve => setTimeout(resolve, ms))

router.add({
    pattern: '/gen',
    // method: 'GET',
    handler: async function* ({req}) {
        console.log('start')
        yield HttpStatus.OK
        console.log('ok yielded')
        yield new Headers({
            'x-foo': 'bar',
            'x-bar': 'baz',
            [CommonHeaders.CONTENT_TYPE]: ContentTypes.PLAIN_TEXT,
        })
        console.log('headers yielded')
        yield await sleep(1000)
        console.log('sleep done')
        return "herro"
    }
})


if(import.meta.main) {
    console.log(router)
}
