/** @jsxImportSource @mpen/jsxhtml */
import type {InputAttributes} from '../htmlspec/elements'

/**
 * `<input type="text">`.
 */
export function TextInput(props: Omit<InputAttributes, 'type' | 'checked'>) {
    return <input {...props} type="text" />
}
