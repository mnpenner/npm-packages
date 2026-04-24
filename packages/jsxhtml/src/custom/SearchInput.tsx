/** @jsxImportSource @mpen/jsxhtml */
import type {InputAttributes} from '../htmlspec/elements'

/**
 * `<input type="search">`.
 */
export function SearchInput(props: Omit<InputAttributes, 'type' | 'checked'>) {
    return <input {...props} type="search" />
}
