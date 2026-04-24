import type {SearchParamsInit} from '../components/Link'

export function mergeSearch(to: string, search: SearchParamsInit): string {
    const hashIndex = to.indexOf('#')
    const hash = hashIndex !== -1 ? to.slice(hashIndex) : ''
    const pathAndQuery = hashIndex !== -1 ? to.slice(0, hashIndex) : to

    const queryIndex = pathAndQuery.indexOf('?')
    const path = queryIndex !== -1 ? pathAndQuery.slice(0, queryIndex) : pathAndQuery
    const existingQuery = queryIndex !== -1 ? pathAndQuery.slice(queryIndex + 1) : ''

    const params = new URLSearchParams(existingQuery)
    const newParams = new URLSearchParams(search as any)

    for (const [key, value] of newParams) {
        params.set(key, value)
    }

    const queryString = params.toString()
    return `${path}${queryString ? '?' + queryString : ''}${hash}`
}

