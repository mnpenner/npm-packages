import React, {Suspense, useMemo} from 'react'
import {useUrl} from './useUrl' // your hook that returns a URL object


export type RouteParams = Record<string, string>

export type RouteComponent =
    | React.ComponentType<RouteParams>
    // | React.LazyExoticComponent<React.ComponentType<RouteParams>>

export type Route = [pattern: string | URLPattern, component: RouteComponent]

export interface RouterProps {
    routes: Route[]
}

/**
 * Simple router that:
 * - Uses the current URL (from `useUrl`)
 * - Tries each route in order
 * - For the first matching URLPattern, renders the component with its path params
 *
 * Example pattern: "/books/:id" → props: { id: string }
 */
export function Router({routes}: RouterProps) {
    const url = useUrl()  // URL object

    const normalizedRoutes = useMemo(() => routes.map(([patt, comp]) => [typeof patt === 'string'
        ? new URLPattern({pathname: patt})
        : patt, comp] as const), [routes])

    for(const [pattern, Component] of normalizedRoutes) {
        const match = pattern.exec(url)
        if(!match) continue

        const params = match.pathname.groups

        return (
                <Component {...params} />
        )
    }

    return null  // no match
}
