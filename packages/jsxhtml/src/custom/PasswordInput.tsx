/** @jsxImportSource @mpen/jsxhtml */
import type {InputAttributes} from '../htmlspec/elements'

/**
 * `<input type="password">`.
 */
export function PasswordInput(props: Omit<InputAttributes, 'type' | 'checked'>) {
    return <input {...props} type="password" />
}
