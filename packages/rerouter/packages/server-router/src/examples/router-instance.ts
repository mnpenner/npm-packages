import {Router} from '../router'
import {createZodNeverjectHandler} from '@mpen/server-router-zod-neverject'
import {okAsync} from 'neverject'
import {z} from 'zod'

const router = new Router()

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

export default router

if(import.meta.main) {
    console.log(router)
}
