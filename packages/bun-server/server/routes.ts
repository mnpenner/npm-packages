import {UriTemplate} from '@mpen/rerouter'
import {Route, RouteMap} from './server-api'




const routes: RouteMap = {

    hello: {
        template: new UriTemplate('/hello{?q*}'),
        async get(req, res) {

            return new Response(Bun.file("./package.json"))
            // console.log(req)
        }
    }
}

export default routes
