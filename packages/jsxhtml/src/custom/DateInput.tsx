/** @jsxImportSource @mpen/jsxhtml */
import type {InputAttributes} from '../htmlspec/elements'

/**
 * `<input type="date">`.
 */
export function DateInput(props: Omit<InputAttributes, 'type' | 'checked'>) {
    return <input {...props} type="date" />
}
