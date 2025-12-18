import {useMemo} from 'react'
import {useUrlPath} from '../hooks'
import {match as pathMatch} from 'path-to-regexp'

export type RouteParams = Record<string, string | undefined>

export type RouteComponent<TParams extends RouteParams = RouteParams> = React.ComponentType<TParams>

export type RouteObject = {
    name: string
    pattern: string | URLPattern
    component: RouteComponent<any>
}

export type RouteTuple = readonly [name: string, pattern: string | URLPattern, component: RouteComponent<any>]

export type Route = RouteObject | RouteTuple

export interface RouterProps {
    routes: readonly Route[]
}

function isRouteTuple(route: Route): route is RouteTuple {
    return Array.isArray(route)
}

function toUrlPattern(pattern: string | URLPattern): URLPattern {
    if (typeof pattern !== 'string') return pattern
    if (pattern === '*') return new URLPattern({pathname: '/*'})
    return new URLPattern({pathname: pattern})
}

export function Router({routes}: RouterProps) {
    const pathname = useUrlPath()

    const normalizedRoutes = useMemo(
        () =>
            routes.map(route => {
                const pattern = isRouteTuple(route) ? route[1] : route.pattern
                const component = isRouteTuple(route) ? route[2] : route.component
                if (typeof pattern !== 'string') {
                    const urlPattern = toUrlPattern(pattern)
                    return [
                        (pathnameToMatch: string) => {
                            const match = urlPattern.exec({pathname: pathnameToMatch} as any)
                            if (!match) return null
                            return ((match as any).pathname?.groups ?? {}) as RouteParams
                        },
                        component,
                    ] as const
                }

                if (pattern === '*') {
                    return [(_pathnameToMatch: string) => ({} as RouteParams), component] as const
                }

                const matcher = pathMatch(pattern, {decode: decodeURIComponent})
                return [
                    (pathnameToMatch: string) => {
                        const m = matcher(pathnameToMatch)
                        if (!m) return null
                        const params: RouteParams = {}
                        for (const [key, value] of Object.entries(m.params as any)) {
                            if (value == null) params[key] = undefined
                            else if (Array.isArray(value)) params[key] = value.join('/')
                            else params[key] = String(value)
                        }
                        return params
                    },
                    component,
                ] as const
            }),
        [routes],
    )

    for (const [matches, Component] of normalizedRoutes) {
        const params = matches(pathname)
        if (!params) continue
        return <Component {...(params as any)} />
    }

    return null
}

