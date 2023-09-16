import {UriTemplate} from '@mpen/rerouter'
import {Route, RouteMap} from './server-api'




const routes: RouteMap = {

    hello: {
        template: new UriTemplate('/hello{?q*}'),
        async get(req, res) {

            res.write("hello!")
            // res.respond(Bun.file("./package.json"))
            // return new Response(Bun.file("./package.json"))
            // console.log(req)
        }
    }
}

export default routes
