import { cc, type ClassValue } from '@mpen/classcat'
import type { Override } from '@mpen/ts-types'
import { useUrlPath } from '../hooks/useUrl'
import { Link, type LinkProps } from './Link'

export type NavLinkMatch = 'exact' | 'prefix'

/**
 * Props for [`NavLink`]{@link NavLink}.
 */
export type NavLinkProps = Override<
    LinkProps,
    {
        /**
         * Classes to apply when the link target matches the current path.
         */
        activeClass?: ClassValue

        /**
         * Classes to apply when the link target does not match the current path.
         */
        inactiveClass?: ClassValue

        /**
         * How to compare the link target to the current path.
         *
         * @defaultValue `'exact'`
         */
        match?: NavLinkMatch
    }
>

function isActivePath(pathname: string, targetPathname: string, match: NavLinkMatch): boolean {
    if (pathname === targetPathname) return true
    if (match === 'exact') return false
    if (targetPathname === '/') return false
    return pathname.startsWith(`${targetPathname}/`)
}

/**
 * Renders a [`Link`]{@link Link} with classes selected from the current route.
 *
 * @example
 * ```tsx
 * <NavLink
 *     activeClass={['pill', 'active']}
 *     inactiveClass={['pill', { muted: true }]}
 *     to="/settings"
 * >
 *     Settings
 * </NavLink>
 * ```
 *
 * @param props - Link props plus active and inactive class values.
 * @returns An anchor element that navigates through rerouter.
 */
export function NavLink({
    activeClass,
    className,
    inactiveClass,
    match = 'exact',
    to,
    ...props
}: NavLinkProps) {
    const pathname = useUrlPath()
    const target = new URL(to, window.location.href)
    const active = isActivePath(pathname, target.pathname, match)
    const linkClassName = cc(className, active ? activeClass : inactiveClass)

    return <Link {...props} className={linkClassName || undefined} to={to} />
}
