import type {AnchorHTMLAttributes, MouseEvent} from 'react'
import {pushUrl, replaceUrl} from '../lib/url'
import {mergeSearch} from '../lib/mergeSearch'

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

