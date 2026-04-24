export function joinPrefixPathname(prefix: string, pathname: string): string {
    if (!prefix) return pathname
    if (!prefix.startsWith('/')) prefix = '/' + prefix
    if (prefix.endsWith('/')) prefix = prefix.slice(0, -1)
    if (pathname === '/') return prefix || '/'
    if (!pathname.startsWith('/')) pathname = '/' + pathname
    return (prefix + pathname) || '/'
}

export function stripPrefixPathname(prefix: string, pathname: string): string | null {
    if (!prefix) return pathname
    if (!prefix.startsWith('/')) prefix = '/' + prefix
    if (prefix.endsWith('/')) prefix = prefix.slice(0, -1)
    if (prefix === '/') return pathname

    if (pathname === prefix) return '/'
    if (pathname.startsWith(prefix + '/')) return pathname.slice(prefix.length)
    return null
}

