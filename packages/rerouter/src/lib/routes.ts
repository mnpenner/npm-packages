import { match as pathMatch } from 'path-to-regexp'
import type { ComponentType } from 'react'

/**
 * Route params captured from the current URL pathname.
 */
export type RouteParams = Record<string, string | undefined>

/**
 * A React component that receives URL params captured for its route.
 *
 * @example
 * ```tsx
 * const UserPage: RouteComponent<{ id: string }> = ({ id }) => <div>{id}</div>
 * ```
 */
export type RouteComponent<TParams extends RouteParams = RouteParams> = ComponentType<TParams>

/**
 * A dynamically imported route component module.
 *
 * @example
 * ```tsx
 * export default function UserPage({ id }: { id: string }) {
 *     return <div>{id}</div>
 * }
 * ```
 */
export type RouteComponentModule<TParams extends RouteParams = RouteParams> = {
    default: RouteComponent<TParams>
}

/**
 * Loads a route component on demand.
 *
 * @example
 * ```tsx
 * const loadUserPage: RouteComponentLoader<{ id: string }> = () => import('./pages/UserPage')
 * ```
 */
export type RouteComponentLoader<TParams extends RouteParams = RouteParams> = () => Promise<
    RouteComponentModule<TParams>
>

/**
 * Object route definition consumed by [`Router`]{@link Router}.
 *
 * @example
 * ```tsx
 * const route: RouteObject = {
 *     name: 'userProfile',
 *     pattern: '/users/:id',
 *     component: () => import('./pages/UserProfile'),
 * }
 * ```
 */
export type RouteObject = {
    name: string
    pattern: string | URLPattern
    component: RouteComponentLoader<any>
}

/**
 * Tuple route definition consumed by [`Router`]{@link Router}.
 *
 * @example
 * ```tsx
 * const route: RouteTuple = ['userProfile', '/users/:id', () => import('./pages/UserProfile')]
 * ```
 */
export type RouteTuple = readonly [
    name: string,
    pattern: string | URLPattern,
    component: RouteComponentLoader<any>,
]

/**
 * A route definition in object or tuple form.
 *
 * @example
 * ```tsx
 * const routes: readonly Route[] = [
 *     { name: 'home', pattern: '/', component: () => import('./pages/Home') },
 * ]
 * ```
 */
export type Route = RouteObject | RouteTuple

/**
 * Route definition normalized into a single object shape with a pathname matcher.
 */
export type NormalizedRoute = {
    name: string
    pattern: string | URLPattern
    component: RouteComponentLoader<any>
    matches(pathname: string): RouteParams | null
}

/**
 * Returns whether a route definition uses tuple form.
 *
 * @param route - The route definition to inspect.
 * @returns `true` when the route is a tuple.
 *
 * @internal
 */
export function isRouteTuple(route: Route): route is RouteTuple {
    return Array.isArray(route)
}

function toUrlPattern(pattern: string | URLPattern): URLPattern {
    if (typeof pattern !== 'string') return pattern
    if (pattern === '*') return new URLPattern({ pathname: '/*' })
    return new URLPattern({ pathname: pattern })
}

/**
 * Normalizes routes into objects with a shared matcher implementation.
 *
 * @param routes - The route definitions to normalize.
 * @returns Routes with stable `name`, `pattern`, `component`, and `matches` fields.
 *
 * @example
 * ```tsx
 * const normalized = normalizeRoutes(routes)
 * const match = normalized[0]?.matches('/users/123')
 * ```
 */
export function normalizeRoutes(routes: readonly Route[]): NormalizedRoute[] {
    return routes.map((route) => {
        const name = isRouteTuple(route) ? route[0] : route.name
        const pattern = isRouteTuple(route) ? route[1] : route.pattern
        const component = isRouteTuple(route) ? route[2] : route.component

        if (typeof pattern !== 'string') {
            const urlPattern = toUrlPattern(pattern)
            return {
                name,
                pattern,
                component,
                matches(pathname: string) {
                    const match = urlPattern.exec({ pathname } as any)
                    if (!match) return null
                    return ((match as any).pathname?.groups ?? {}) as RouteParams
                },
            }
        }

        if (pattern === '*') {
            return {
                name,
                pattern,
                component,
                matches: (_pathname: string) => ({}),
            }
        }

        const matcher = pathMatch(pattern, { decode: decodeURIComponent })
        return {
            name,
            pattern,
            component,
            matches(pathname: string) {
                const match = matcher(pathname)
                if (!match) return null
                const params: RouteParams = {}
                for (const [key, value] of Object.entries(match.params as any)) {
                    if (value == null) params[key] = undefined
                    else if (Array.isArray(value)) params[key] = value.join('/')
                    else params[key] = String(value)
                }
                return params
            },
        }
    })
}
