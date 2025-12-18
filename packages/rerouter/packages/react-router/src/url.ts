export function pushUrl(next: string, state?: unknown): void {
    if (typeof window === 'undefined') return
    history.pushState(state ?? null, '', next)
    window.scrollTo(0, 0)
    window.dispatchEvent(new PopStateEvent('popstate'))
}

export function replaceUrl(next: string, state?: unknown): void {
    if (typeof window === 'undefined') return
    history.replaceState(state ?? null, '', next)
    window.dispatchEvent(new PopStateEvent('popstate'))
}

