/** @jsxImportSource @mpen/jsxhtml */
import type {InputAttributes} from '../htmlspec/elements'

/**
 * `<input type="radio">`.
 */
export function RadioButton(props: Omit<InputAttributes, 'type' | 'checked'>) {
    return <input {...props} type="radio" />
}
