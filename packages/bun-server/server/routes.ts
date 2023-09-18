import {UriParams, UriTemplate} from '@mpen/rerouter'
import {createRoute, Route, RouteMap} from './server-api'
import {sleep} from 'bun'
import {byteSize, PartialRecord} from './util'




const routes = {
    hello: createRoute<{q:Record<string,string>}>({
        template: new UriTemplate('/hello{?q*}'),
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
    })
} satisfies RouteMap

export default routes

