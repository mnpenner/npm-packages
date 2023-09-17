import {UriTemplate} from '@mpen/rerouter'
import {Route, RouteMap} from './server-api'
import {sleep} from 'bun'




const routes: RouteMap = {

    hello: {
        template: new UriTemplate('/hello{?q*}'),
        async get(req, res) {

            // res.sendHeaders({'Transfer-Encoding':'chunked','foo':'bar'})
            // res.tryWrite("hello")
            await sleep(800)
            res.flushHeaders()
            res.tryWrite(" world")
            await sleep(1200)
            res.tryWrite("!")
            res.end()


            // res.close()
            // res.respond(Bun.file("./package.json"))
            // return new Response(Bun.file("./package.json"))
            // console.log(req)

            // console.log("return from route")
        }
    }
}

export default routes

