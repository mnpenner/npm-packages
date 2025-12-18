import type {AnchorHTMLAttributes, MouseEvent} from 'react'
import {pushUrl, replaceUrl} from './url'

export type SearchParamsInit =
    | string
    | string[][]
    | Record<string, string | number | boolean | undefined | null>
    | URLSearchParams

export interface LinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'onClick'> {
    to: string
    search?: SearchParamsInit
    replace?: boolean
}

function mergeSearch(to: string, search: SearchParamsInit): string {
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

export function Link({to, search, children, replace, ...rest}: LinkProps) {
    const href = search ? mergeSearch(to, search) : to

    const onClick = (ev: MouseEvent<HTMLAnchorElement>) => {
        if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return
        if (ev.button !== 0) return
        ev.preventDefault()
        replace ? replaceUrl(href) : pushUrl(href)
    }

    return (
        <a {...rest} href={href} onClick={onClick}>
            {children}
        </a>
    )
}

