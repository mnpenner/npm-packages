export function pushUrl(next: string, state?: unknown): void {
    window.history.pushState(state, '', next)
    window.dispatchEvent(new PopStateEvent('popstate'))
}

export function replaceUrl(next: string, state?: unknown): void {
    window.history.replaceState(state, '', next)
    window.dispatchEvent(new PopStateEvent('popstate'))
}

