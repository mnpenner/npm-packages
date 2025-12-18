import {useSyncExternalStore, useMemo} from 'react'

// Snapshot getters
const getHref = () => window.location.href
const getPathname = () => window.location.pathname
const getSearch = () => window.location.search

/**
 * Subscribes to browser URL changes.
 *
 * Listens for:
 * - `popstate` (back/forward navigation)
 * - `hashchange`
 *
 * @param cb Callback invoked on any URL change
 * @returns Cleanup function
 */
function subscribe(cb: () => void) {
    const handler = () => cb()
    window.addEventListener('popstate', handler)
    window.addEventListener('hashchange', handler)
    return () => {
        window.removeEventListener('popstate', handler)
        window.removeEventListener('hashchange', handler)
    }
}

/**
 * Returns the current absolute URL as a string.
 *
 * @returns {string} The full URL (`window.location.href`)
 */
export function useAbsoluteUrl(): string {
    return useSyncExternalStore(subscribe, getHref)
}

/**
 * Returns the current URL pathname.
 *
 * Triggers a re-render only when the pathname changes, ignoring
 * query parameter or hash changes.
 *
 * @example
 * const path = useUrlPath() // "/users/42"
 *
 * @returns {string} The pathname portion of the URL
 */
export function useUrlPath(): string {
    return useSyncExternalStore(subscribe, getPathname)
}

/**
 * Returns the current URL's search parameters.
 *
 * The returned `URLSearchParams` object is memoized and stable
 * unless the query string actually changes.
 *
 * @example
 * const params = useUrlSearchParams()
 * const page = params.get('page')
 *
 * @returns {URLSearchParams} Object for reading search parameters
 */
export function useUrlSearchParams(): URLSearchParams {
    const search = useSyncExternalStore(subscribe, getSearch)
    return useMemo(() => new URLSearchParams(search), [search])
}

/**
 * Returns the current URL as a parsed `URL` object.
 *
 * The returned `URL` object is memoized and stable unless
 * the href changes.
 *
 * @example
 * const url = useUrl()
 * console.log(url.hash) // "#top"
 *
 * @returns {URL} Parsed URL object
 */
export function useUrl(): URL {
    const href = useAbsoluteUrl()
    return useMemo(() => new URL(href), [href])
}
