import {
    Handler,
    MethodHandlers,
    NamedRoute,
    PatternRouteMap,
    TemplateInterface
} from './server-api'
import {UriMatch, UriParams, UriTemplate} from '@mpen/rerouter'
import {resolveUrl} from './url-resolve'

type MatchResult = { route: NamedRoute, match: UriMatch<UriParams> }


export class Router {
    private routes: NamedRoute[] = []
    private namedRoutes = new Map<string, NamedRoute>()
    private baseUrl: string | undefined

    // async handle(req: Request): Promise<Response> {
    //     return new Response("Not Implemented", {status: 501})
    // }

    match(url: string): MatchResult | null {
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

    setBaseUrl(url: string) {
        this.baseUrl = url
        return this
    }

    resolve<P extends UriParams>(name: string, params: P) {
        const route = this.namedRoutes.get(name)
        if(route) {
            const url = route.template.expand(params)
            if(this.baseUrl?.length) {
                return resolveUrl(this.baseUrl, url)
            }
            return url
        }
        throw new Error(`Route "${name}" not found`)
    }

    registerUrl<P extends UriParams>(urlPattern: string | TemplateInterface<P>, handlers: MethodHandlers<P>, name?: string) {
        const route = {
            name,
            template: typeof urlPattern === 'string' ? new UriTemplate<P>(urlPattern) : urlPattern,
            handlers,
        }
        this.routes.push(route)
        if(name?.length) {
            this.namedRoutes.set(name, route)
        }
    }

    registerMap<T extends Record<string, any>>(routes: PatternRouteMap<T>) {
        for(const [name, {url, ...handlers}] of Object.entries(routes)) {
            this.registerUrl(url, handlers, name)
        }
    }


    get<P extends UriParams>(urlPattern: string | TemplateInterface<P>, handler: Handler<P>, name?: string) {
        this.registerUrl(urlPattern, {get: handler}, name)
        return this
    }

    post<P extends UriParams>(urlPattern: string | TemplateInterface<P>, handler: Handler<P>, name?: string) {
        this.registerUrl(urlPattern, {post: handler}, name)
        return this
    }
}

//////

async function main(programArgs: string[]): Promise<number | void> {
    const router = new Router()

    router.setBaseUrl('https://software.limo')

    router.get('/bookings/{id:int}', (req, res) => {

        const foo = req.url.params.id
    }, 'bookings.show')

    router.registerMap({
        hello: {
            url: '/foo{?q*}',
            get(req, res) {
                res.respond(`Hello ${req.url.params.who}`)
            }
        },
        world: {
            url: new UriTemplate<{ who: string }>('/hello/{who}'),
            get(req, res) {
                res.respond(`Hello ${req.url.params.who}`)
            }
        }
    })

    console.log(router.resolve('world', {who: 'Mark'}))
    console.log(router.resolve('world', {who: 'Michael'}))
    console.log(router.resolve('bookings.show', {id: 133763}))
    console.log(router.match('/hello/Nick'))
}

if(process.isBun && process.argv[1] === __filename) {
    main(process.argv.slice(2))
        .then(exitCode => {
            if(exitCode != null) {
                process.exitCode = exitCode
            }
        }, err => {
            console.error(err || "an unknown error occurred")
            process.exitCode = 1
        })
}


