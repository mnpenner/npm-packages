/** @jsxImportSource @mpen/jsxhtml */
import type {InputAttributes} from '../htmlspec/elements'

/**
 * `<input type="file">`.
 */
export function FileInput(props: Omit<InputAttributes, 'type' | 'checked'>) {
    return <input {...props} type="file" />
}
