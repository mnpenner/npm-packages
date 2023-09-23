import {UriParams, UriTemplate} from '@mpen/rerouter'
import {createRoute, CompiledRoute, CompiledRouteMap, routeMap} from './server-api'
import {sleep} from 'bun'
import {byteSize, PartialRecord} from './util'
import {Router} from './router'


const router = new Router()




router.registerMap({
    hello: {
        url: new UriTemplate<{q:Record<string,string>}>('/hello{?q*}'),
        async get(req, res) {



            // res.respond("yoyoyoy")
            res.flushHeaders()
            res.write(new Uint8Array([72,101,108,108,111]))
            res.end()


            // res.close()
            // res.respond(Bun.file("./package.json"))
            // return new Response(Bun.file("./package.json"))
            // console.log(req)

            // console.log("return from route")
        }
    },
    world: {
        url: new UriTemplate<{who:string}>('/hello/{who}'),
        async get(req, res) {
            res.text(`Hello ${req.url.params.who}`)
        }
    }
})

export default router
