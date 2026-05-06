import { cc, type ClassValue } from '@mpen/classcat'
import type { Override } from '@mpen/ts-types'
import { useUrlPath } from '../hooks/useUrl'
import { Link, type LinkProps } from './Link'

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
    }
>

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
export function NavLink({ activeClass, className, inactiveClass, to, ...props }: NavLinkProps) {
    const pathname = useUrlPath()
    const target = new URL(to, window.location.href)
    const active = pathname === target.pathname
    const linkClassName = cc(className, active ? activeClass : inactiveClass)

    return <Link {...props} className={linkClassName || undefined} to={to} />
}
