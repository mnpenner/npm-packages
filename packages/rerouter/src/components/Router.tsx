import { startTransition, Suspense, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useUrlPath } from '../hooks'
import {
    normalizeRoutes,
    type NormalizedRoute,
    type Route,
    type RouteComponent,
} from '../lib/routes'

const DEFAULT_LOADING_DELAY_MS = 300
const loadedRouteComponents = new WeakMap<Route['component'], RouteComponent<any>>()
const loadingRouteComponents = new WeakMap<Route['component'], Promise<RouteComponent<any>>>()

type RouteMatch = {
    route: NormalizedRoute
    params: Record<string, string | undefined>
    pathname: string
}

type RenderedRoute = RouteMatch & {
    Component: RouteComponent<any>
}

function loadRouteComponent(component: Route['component']): Promise<RouteComponent<any>> {
    const loaded = loadedRouteComponents.get(component)
    if (loaded) return Promise.resolve(loaded)

    let loading = loadingRouteComponents.get(component)
    if (!loading) {
        loading = component().then((module) => {
            loadedRouteComponents.set(component, module.default)
            loadingRouteComponents.delete(component)
            return module.default
        })
        loadingRouteComponents.set(component, loading)
    }

    return loading
}

function findRouteMatch(routes: readonly NormalizedRoute[], pathname: string): RouteMatch | null {
    for (const route of routes) {
        const params = route.matches(pathname)
        if (!params) continue
        return { route, params, pathname }
    }

    return null
}

function getLoadedRoute(match: RouteMatch | null): RenderedRoute | null {
    if (!match) return null

    const Component = loadedRouteComponents.get(match.route.component)
    if (!Component) return null

    return {
        ...match,
        Component,
    }
}

function scheduleTransition(cb: () => void): void {
    queueMicrotask(() => {
        startTransition(cb)
    })
}

function useRenderedRoute(
    match: RouteMatch | null,
    loadingDelayMs: number,
): { renderedRoute: RenderedRoute | null; showLoading: boolean } {
    const [renderedRoute, setRenderedRoute] = useState(() => getLoadedRoute(match))
    const [showLoading, setShowLoading] = useState(false)
    const [loadError, setLoadError] = useState<unknown>(null)

    useEffect(() => {
        if (!match) {
            scheduleTransition(() => {
                setRenderedRoute(null)
                setShowLoading(false)
                setLoadError(null)
            })
            return
        }

        const loaded = getLoadedRoute(match)
        if (loaded) {
            scheduleTransition(() => {
                setRenderedRoute(loaded)
                setShowLoading(false)
                setLoadError(null)
            })
            return
        }

        let active = true
        let timeout: ReturnType<typeof setTimeout> | undefined

        scheduleTransition(() => {
            setShowLoading(false)
        })

        if (loadingDelayMs <= 0) {
            timeout = setTimeout(() => {
                if (active) setShowLoading(true)
            }, 0)
        } else {
            timeout = setTimeout(() => {
                if (active) setShowLoading(true)
            }, loadingDelayMs)
        }

        loadRouteComponent(match.route.component)
            .then((Component) => {
                if (!active) return
                if (timeout) clearTimeout(timeout)

                startTransition(() => {
                    setRenderedRoute({ ...match, Component })
                    setShowLoading(false)
                    setLoadError(null)
                })
            })
            .catch((error: unknown) => {
                if (!active) return
                setLoadError(error)
            })

        return () => {
            active = false
            if (timeout) clearTimeout(timeout)
        }
    }, [loadingDelayMs, match])

    if (loadError) throw loadError

    return { renderedRoute, showLoading }
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

    /**
     * Delay before rendering [`RouterProps.loading`]{@link RouterProps#loading} for a suspended
     * route, in milliseconds.
     *
     * @defaultValue `400`
     */
    loadingDelayMs?: number
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
 *     return <Router routes={routes} loading={<div>Loading...</div>} loadingDelayMs={400} />
 * }
 * ```
 */
export function Router({
    routes,
    loading = null,
    loadingDelayMs = DEFAULT_LOADING_DELAY_MS,
}: RouterProps) {
    const pathname = useUrlPath()

    const normalizedRoutes = useMemo(() => normalizeRoutes(routes), [routes])
    const match = useMemo(
        () => findRouteMatch(normalizedRoutes, pathname),
        [normalizedRoutes, pathname],
    )
    const { renderedRoute, showLoading } = useRenderedRoute(match, loadingDelayMs)

    if (showLoading) return loading
    if (!renderedRoute) return null

    const { Component, params } = renderedRoute

    return (
        <Suspense fallback={loading}>
            <Component {...(params as any)} />
        </Suspense>
    )
}
