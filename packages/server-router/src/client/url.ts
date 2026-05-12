/**
 * Append an object of query values to a URL.
 *
 * @example
 * ```ts
 * withQuery('/widgets', { view: 'full', tag: ['a', 'b'] })
 * ```
 *
 * @param url - URL without generated query parameters.
 * @param query - Query parameter object.
 * @returns The URL with serialized query parameters.
 */
export function withQuery(url: string, query: object): string {
    const searchParams = new URLSearchParams()
    for (const [key, value] of Object.entries(query)) {
        if (value == null) continue
        if (Array.isArray(value)) {
            for (const item of value) {
                if (item != null)
                    searchParams.append(
                        key,
                        typeof item === 'object' ? JSON.stringify(item) : String(item),
                    )
            }
            continue
        }
        searchParams.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value))
    }
    const search = searchParams.toString()
    return search.length > 0 ? `${url}?${search}` : url
}
