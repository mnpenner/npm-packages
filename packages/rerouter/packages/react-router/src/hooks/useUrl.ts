import {useMemo, useSyncExternalStore} from 'react'

const isBrowser = typeof window !== 'undefined'

// Snapshot getters
const getHref = () => (isBrowser ? window.location.href : 'http://localhost/')
const getPathname = () => (isBrowser ? window.location.pathname : '/')
const getSearch = () => (isBrowser ? window.location.search : '')

function subscribe(cb: () => void): () => void {
    if (!isBrowser) return () => {}
    const handler = () => cb()
    window.addEventListener('popstate', handler)
    window.addEventListener('hashchange', handler)
    return () => {
        window.removeEventListener('popstate', handler)
        window.removeEventListener('hashchange', handler)
    }
}

export function useAbsoluteUrl(): string {
    return useSyncExternalStore(subscribe, getHref, getHref)
}

export function useUrlPath(): string {
    return useSyncExternalStore(subscribe, getPathname, getPathname)
}

export function useUrlSearchParams(): URLSearchParams {
    const search = useSyncExternalStore(subscribe, getSearch, getSearch)
    return useMemo(() => new URLSearchParams(search), [search])
}

export function useUrl(): URL {
    const href = useAbsoluteUrl()
    return useMemo(() => new URL(href), [href])
}

