#!bun
import { run, bench, group, do_not_optimize } from 'mitata';
import {Router} from './router'
import {NOOP} from '#shared/constants'

interface MitataState {
    get(name: string): any;
}


bench(`$quantity routes | match('GET',"$path")`, function*(state: MitataState) {
    const router = new Router()
    router.get('/first', () => new Response("Hello First"))
    router.get('/error', () => {
        throw new Error('Error')
    })
    for(let i=0; i<state.get('quantity'); ++i) {
        router.get(`/route${i}`, () => new Response(`Hello ${i}`))
    }
    router.get('/last', () => new Response("Hello Last"))
    const path = state.get('path')

    yield () => do_not_optimize(router.match('GET',path))
})
    .args('path',['/first','/last','/notfound','/error'])
    .range('quantity',1,1024)


group('hono', () => {

// compare to https://hono.dev/docs/concepts/benchmarks | https://github.com/honojs/hono/blob/02377efde52c5b182a1d1ade904b1a3caea7f827/benchmarks/routers/src/bench.mts#L1
    const HONO_ROUTES = [
        { method: 'GET', path: '/user' },
        { method: 'GET', path: '/user/comments' },
        { method: 'GET', path: '/user/avatar' },
        { method: 'GET', path: '/user/lookup/username/:username' },
        { method: 'GET', path: '/user/lookup/email/:address' },
        { method: 'GET', path: '/event/:id' },
        { method: 'GET', path: '/event/:id/comments' },
        { method: 'POST', path: '/event/:id/comment' },
        { method: 'GET', path: '/map/:location/events' },
        { method: 'GET', path: '/status' },
        { method: 'GET', path: '/very/deeply/nested/route/hello/there' },
        { method: 'GET', path: '/static/*' },
    ]

    const HONO_TEST_CASES =[
        {
            name: 'short static',
            method: 'GET',
            path: '/user',
        },
        {
            name: 'static with same radix',
            method: 'GET',
            path: '/user/comments',
        },
        {
            name: 'dynamic route',
            method: 'GET',
            path: '/user/lookup/username/hey',
        },
        {
            name: 'mixed static dynamic',
            method: 'GET',
            path: '/event/abcd1234/comments',
        },
        {
            name: 'post',
            method: 'POST',
            path: '/event/abcd1234/comment',
        },
        {
            name: 'long static',
            method: 'GET',
            path: '/very/deeply/nested/route/hello/there',
        },
        {
            name: 'wildcard',
            method: 'GET',
            path: '/static/index.html',
        },
    ]

    const router = new Router()
        .get('/user',NOOP)

    for(const r of HONO_ROUTES) {
        router.on(r.method, r.path, NOOP)
    }

    for(const tc of HONO_TEST_CASES) {
        bench(`${tc.name} - ${tc.method} ${tc.path}`, () => {
            router.match(tc.method, tc.path)
        })
    }

})

await run();
