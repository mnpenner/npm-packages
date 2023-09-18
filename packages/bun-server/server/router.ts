import {Handler, MethodHandlers, NamedRoute, CompiledRouteMap, PatternRouteMap, CompiledRoute} from './server-api'
import {UriMatch, UriParams, UriTemplate} from '@mpen/rerouter'
import routes from './routes'


type MatchResult = {route: NamedRoute, match: UriMatch<UriParams>}

export class Router {

    private routes: NamedRoute[] = []

    async handle(req: Request): Promise<Response> {
        return new Response("Not Implemented", {status: 501})
    }

    match(url: string): MatchResult|null {
        let bestRoute: NamedRoute | undefined
        let maxScore = Number.NEGATIVE_INFINITY
        let bestMatch: UriMatch<any> | undefined

        for(const route of this.routes) {
            const match = route.template.match(url)
            if(match && match.score > maxScore) {
                maxScore = match.score
                bestRoute = route
                bestMatch = match
            }
        }
        if(!bestRoute || !bestMatch) {
            return null
        }

        return {route: bestRoute, match: bestMatch}
    }

    link<P extends UriParams>(name: string, params: P) {
        for(const route of this.routes) {
            if(route.name === name) {
                return route.template.expand(params)
            }
        }
        throw new Error(`Route "${name}" not found`)
    }

    registerMap<T extends Record<string, any>>(routes: PatternRouteMap<T>) {
        for(const [name, {url,...handlers}] of Object.entries(routes)) {
            this.register(url, handlers, name)
        }
    }

    register<P extends UriParams>(urlPattern: string|UriTemplate<P>, handlers: MethodHandlers<P>, name?: string) {
        this.routes.push({
            ...handlers,
            name,
            template: typeof urlPattern === 'string' ? new UriTemplate<P>(urlPattern) : urlPattern,
        })
    }

    get<P extends UriParams>(urlPattern: string|UriTemplate<P>, handler: Handler<P>, name?: string) {
        this.register(urlPattern, {get:handler}, name)
    }

}

//////

const router = new Router()


router.get('/bookings/{id:int}', (req,res) => {

    const foo = req.url.params.id
})

router.registerMap({
    hello: {
        url: '/foo{?q*}',
        get(req, res) {
            res.respond(`Hello ${req.url.params.who}`)  // FIXME: params should resolve to UriParams
        }
    },
    world: {
        url: new UriTemplate<{who:string}>('/hello/{who}'),
        get(req, res) {
            res.respond(`Hello ${req.url.params.who}`)
        }
    }
})
