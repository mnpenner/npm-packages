import React, {type AnchorHTMLAttributes} from 'react'
import {pushUrl, replaceUrl} from './url'

export type SearchParamsInit =
    | string
    | string[][]
    | Record<string, string | number | boolean | undefined | null>
    | URLSearchParams

export interface LinkProps
    extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'onClick'> {
    to: string
    search?: SearchParamsInit
    replace?: boolean
}

export function Link({to, search, children, replace, ...rest}: LinkProps) {
    let href = to

    if (search) {
        const hashIndex = to.indexOf('#')
        const hash = hashIndex !== -1 ? to.slice(hashIndex) : ''
        const pathAndQuery = hashIndex !== -1 ? to.slice(0, hashIndex) : to

        const queryIndex = pathAndQuery.indexOf('?')
        const path = queryIndex !== -1 ? pathAndQuery.slice(0, queryIndex) : pathAndQuery
        const existingQuery = queryIndex !== -1 ? pathAndQuery.slice(queryIndex + 1) : ''

        const params = new URLSearchParams(existingQuery)
        // Cast to 'any' to allow Record<string, number/boolean>
        const newParams = new URLSearchParams(search as any)

        // Iterate directly using for...of
        for (const [key, value] of newParams) {
            params.set(key, value)
        }

        const queryString = params.toString()
        href = `${path}${queryString ? '?' + queryString : ''}${hash}`
    }

    const onClick = (ev: React.MouseEvent<HTMLAnchorElement>) => {
        if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return
        ev.preventDefault()
        replace ? replaceUrl(href) : pushUrl(href)
    }

    return (
        <a {...rest} href={href} onClick={onClick}>
            {children}
        </a>
    )
}
