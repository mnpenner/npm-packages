import { cc, type ClassValue } from '@mpen/classcat'
import type { AnchorHTMLAttributes, MouseEvent } from 'react'
import { pushUrl, replaceUrl } from '../lib/url'
import { mergeSearch } from '../lib/mergeSearch'

/**
 * Values accepted by [`Link`]{@link Link} for building query strings.
 *
 * @example
 * ```tsx
 * <Link to="/matches" search={{ page: 2, sort: 'desc' }}>
 *     Matches
 * </Link>
 * ```
 */
export type SearchParamsInit =
    | string
    | string[][]
    | Record<string, string | number | boolean | undefined | null>
    | URLSearchParams

/**
 * Props for [`Link`]{@link Link}.
 */
export interface LinkProps extends Omit<
    AnchorHTMLAttributes<HTMLAnchorElement>,
    'className' | 'href' | 'onClick'
> {
    /**
     * Classes to apply to the rendered anchor.
     */
    className?: ClassValue

    /**
     * Destination URL passed to the rendered anchor's `href` attribute.
     */
    to: string

    /**
     * Query parameters to merge into [`LinkProps.to`]{@link LinkProps#to}.
     */
    search?: SearchParamsInit

    /**
     * Whether navigation should replace the current history entry instead of pushing a new one.
     */
    replace?: boolean
}

/**
 * Renders an anchor that navigates with rerouter history updates on ordinary clicks.
 *
 * @example
 * ```tsx
 * <Link to="/matches/42" search={{ tab: 'details' }}>
 *     View match
 * </Link>
 * ```
 *
 * @param props - Anchor props plus rerouter navigation options.
 * @returns An anchor element that pushes or replaces the browser URL.
 */
export function Link({ to, search, children, className, replace, ...rest }: LinkProps) {
    const href = search ? mergeSearch(to, search) : to
    const linkClassName = cc(className)

    const onClick = (ev: MouseEvent<HTMLAnchorElement>) => {
        if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return
        if (ev.button !== 0) return
        ev.preventDefault()
        if (replace) {
            replaceUrl(href)
        } else {
            pushUrl(href)
        }
    }

    return (
        <a {...rest} className={linkClassName || undefined} href={href} onClick={onClick}>
            {children}
        </a>
    )
}
