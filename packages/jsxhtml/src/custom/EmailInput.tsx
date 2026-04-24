/** @jsxImportSource @mpen/jsxhtml */
import type {InputAttributes} from '../htmlspec/elements'

/**
 * `<input type="email">`.
 */
export function EmailInput(props: Omit<InputAttributes, 'type' | 'checked'>) {
    return <input {...props} type="email" />
}
