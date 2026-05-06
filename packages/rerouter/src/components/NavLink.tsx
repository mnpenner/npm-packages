import { cc, type ClassValue } from '@mpen/classcat'
import { useUrlPath } from '../hooks/useUrl'
import { Link, type LinkProps } from './Link'

/**
 * Props for [`NavLink`]{@link NavLink}.
 */
export interface NavLinkProps extends Omit<LinkProps, 'className'> {
    /**
     * Classes to apply when the link target matches the current path.
     */
    activeClass?: ClassValue

    /**
     * Classes to apply when the link target does not match the current path.
     */
    inactiveClass?: ClassValue
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
export function NavLink({ activeClass, inactiveClass, to, ...props }: NavLinkProps) {
    const pathname = useUrlPath()
    const target = new URL(to, window.location.origin)
    const className = cc(pathname === target.pathname ? activeClass : inactiveClass)

    return <Link {...props} className={className || undefined} to={to} />
}
