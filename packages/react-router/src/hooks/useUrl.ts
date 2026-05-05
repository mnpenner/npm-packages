import { useMemo, useSyncExternalStore } from 'react'

// Snapshot getters
const getPathname = () => window.location.pathname
const getSearch = () => window.location.search

function subscribe(cb: () => void): () => void {
    const handler = () => cb()
    window.addEventListener('popstate', handler)
    return () => {
        window.removeEventListener('popstate', handler)
    }
}


export function useUrlPath(): string {
    return useSyncExternalStore(subscribe, getPathname, getPathname)
}

export function useUrlSearchParams(): URLSearchParams {
    const search = useSyncExternalStore(subscribe, getSearch, getSearch)
    return useMemo(() => new URLSearchParams(search), [search])
}
