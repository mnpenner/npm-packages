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
    /**
     * Optional route name used by the CLI to generate a URL helper.
     *
     * Routes without a name still participate in runtime matching, but are skipped by the
     * helper generator.
     */
    name?: string
    pattern: string | URLPattern
    component: RouteComponentLoader<any>
}

/**
 * Route definition consumed by [`Router`]{@link Router}.
 *
 * @example
 * ```tsx
 * const routes: readonly Route[] = [
 *     { name: 'home', pattern: '/', component: () => import('./pages/Home') },
 *     { pattern: '/users/:id', component: () => import('./pages/UserLayout') },
 * ]
 * ```
 */
export type Route = RouteObject

/**
 * Route definition normalized into a single object shape with a pathname matcher.
 */
export type NormalizedRoute = {
    name?: string
    pattern: string | URLPattern
    component: RouteComponentLoader<any>
    matches(pathname: string): RouteParams | null
}

function toUrlPattern(pattern: string | URLPattern): URLPattern {
    if (typeof pattern !== 'string') return pattern
    if (pattern === '*') return new URLPattern({ pathname: '/*' })
    return new URLPattern({ pathname: pattern })
}

function decodeRouteParams(groups: Record<string, unknown>): RouteParams {
    const params: RouteParams = {}
    for (const [key, value] of Object.entries(groups)) {
        if (value == null) params[key] = undefined
        else params[key] = decodeURIComponent(String(value))
    }
    return params
}

function stripLegacyParamPattern(pattern: string, startIndex: number): number {
    let depth = 1
    let endIndex = startIndex + 1
    while (endIndex < pattern.length && depth > 0) {
        const char = pattern[endIndex]
        if (char === '\\') {
            endIndex += 2
            continue
        }
        if (char === '(') depth++
        else if (char === ')') depth--
        endIndex++
    }
    return endIndex
}

/**
 * Converts legacy `path-to-regexp` syntax that is ignored by URL generation into syntax accepted
 * by the current parser.
 *
 * @param pattern - The route pattern to normalize.
 * @returns The pattern with custom regexp constraints stripped and optional group suffixes removed.
 *
 * @example
 * ```ts
 * normalizeLegacyPathToRegexpSyntax('/blog/:id(\\d+){-:title}?')
 * // '/blog/:id{-:title}'
 * ```
 *
 * @internal
 */
export function normalizeLegacyPathToRegexpSyntax(pattern: string): string {
    let normalized = ''
    for (let i = 0; i < pattern.length; i++) {
        const char = pattern[i]
        if (char === '\\') {
            normalized += char
            if (i + 1 < pattern.length) normalized += pattern[++i]
            continue
        }

        if (char === ':' || char === '*') {
            normalized += char
            while (i + 1 < pattern.length && /[$_\p{ID_Continue}]/u.test(pattern[i + 1])) {
                normalized += pattern[++i]
            }
            if (pattern[i + 1] === '(') {
                i = stripLegacyParamPattern(pattern, i + 1) - 1
            }
            continue
        }

        if (char === '}' && pattern[i + 1] === '?') {
            normalized += char
            i++
            continue
        }

        normalized += char
    }
    return normalized
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
        const { name, pattern, component } = route

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

        let matcher: ReturnType<typeof pathMatch> | undefined
        let urlPattern: URLPattern | undefined
        try {
            matcher = pathMatch(pattern, { decode: decodeURIComponent })
        } catch {
            try {
                urlPattern = toUrlPattern(pattern)
            } catch {
                matcher = pathMatch(normalizeLegacyPathToRegexpSyntax(pattern), {
                    decode: decodeURIComponent,
                })
            }
        }
        return {
            name,
            pattern,
            component,
            matches(pathname: string) {
                if (urlPattern) {
                    const match = urlPattern.exec({ pathname } as any)
                    if (!match) return null
                    return decodeRouteParams((match as any).pathname?.groups ?? {})
                }

                if (!matcher) return null
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
