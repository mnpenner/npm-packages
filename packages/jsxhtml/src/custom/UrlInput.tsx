/** @jsxImportSource @mpen/jsxhtml */
import type {InputAttributes} from '../htmlspec/elements'

/**
 * `<input type="url">`.
 */
export function UrlInput(props: Omit<InputAttributes, 'type' | 'checked'>) {
    return <input {...props} type="url" />
}
