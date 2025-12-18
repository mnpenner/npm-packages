import {useMemo} from 'react'
import {useUrl} from './useUrl'

export type RouteParams = Record<string, string | undefined>

export type RouteComponent = React.ComponentType<RouteParams>

export type Route = readonly [pattern: string | URLPattern, component: RouteComponent]

export interface RouterProps {
    routes: readonly Route[]
}

function toUrlPattern(pattern: string | URLPattern): URLPattern {
    if (typeof pattern !== 'string') return pattern
    return new URLPattern({pathname: pattern})
}

export function Router({routes}: RouterProps) {
    const url = useUrl()

    const normalizedRoutes = useMemo(
        () => routes.map(([pattern, component]) => [toUrlPattern(pattern), component] as const),
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

