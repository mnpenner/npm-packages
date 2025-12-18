import {useMemo} from 'react'
import {useUrl} from './useUrl'

export type RouteParams = Record<string, string | undefined>

export type RouteComponent = React.ComponentType<RouteParams>

export type RouteObject = {
    name: string
    pattern: string | URLPattern
    component: RouteComponent
}

export type RouteTuple = readonly [name: string, pattern: string | URLPattern, component: RouteComponent]

export type Route = RouteObject | RouteTuple

export interface RouterProps {
    routes: readonly Route[]
}

function isRouteTuple(route: Route): route is RouteTuple {
    return Array.isArray(route)
}

function toUrlPattern(pattern: string | URLPattern): URLPattern {
    if (typeof pattern !== 'string') return pattern
    return new URLPattern({pathname: pattern})
}

export function Router({routes}: RouterProps) {
    const url = useUrl()

    const normalizedRoutes = useMemo(
        () =>
            routes.map(route => {
                const pattern = isRouteTuple(route) ? route[1] : route.pattern
                const component = isRouteTuple(route) ? route[2] : route.component
                return [toUrlPattern(pattern), component] as const
            }),
        [routes],
    )

    for (const [pattern, Component] of normalizedRoutes) {
        const match = pattern.exec(url)
        if (!match) continue
        const params = (match as any).pathname?.groups ?? {}
        return <Component {...params} />
    }

    return null
}
