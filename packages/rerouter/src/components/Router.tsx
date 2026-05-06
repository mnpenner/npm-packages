import { lazy, Suspense, useMemo, type ReactNode } from 'react'
import { useUrlPath } from '../hooks'
import { normalizeRoutes, type Route } from '../lib/routes'

type LazyRouteComponent = ReturnType<typeof lazy>

const lazyRouteComponents = new WeakMap<Route['component'], LazyRouteComponent>()

function getLazyRouteComponent(component: Route['component']): LazyRouteComponent {
    let LazyComponent = lazyRouteComponents.get(component)
    if (!LazyComponent) {
        LazyComponent = lazy(component)
        lazyRouteComponents.set(component, LazyComponent)
    }
    return LazyComponent
}

/**
 * Props for [`Router`]{@link Router}.
 *
 * @example
 * ```tsx
 * <Router routes={routes} loading={<div>Loading...</div>} />
 * ```
 */
export interface RouterProps {
    /**
     * Route definitions to match against the current URL pathname.
     */
    routes: readonly Route[]
    /**
     * Optional fallback rendered while a matched route component module is loading.
     */
    loading?: ReactNode
}

/**
 * Renders the first route that matches the current URL pathname.
 *
 * @param props - The router props.
 * @returns The matched lazy route component, the loading fallback, or `null`.
 *
 * @example
 * ```tsx
 * import routes from './routes'
 *
 * function App() {
 *     return <Router routes={routes} loading={<div>Loading...</div>} />
 * }
 * ```
 */
export function Router({ routes, loading = null }: RouterProps) {
    const pathname = useUrlPath()

    const normalizedRoutes = useMemo(
        () =>
            normalizeRoutes(routes).map((route) => ({
                ...route,
                Component: getLazyRouteComponent(route.component),
            })),
        [routes],
    )

    for (const { matches, Component } of normalizedRoutes) {
        const params = matches(pathname)
        if (!params) continue
        return (
            <Suspense fallback={loading}>
                <Component {...(params as any)} />
            </Suspense>
        )
    }

    return null
}
