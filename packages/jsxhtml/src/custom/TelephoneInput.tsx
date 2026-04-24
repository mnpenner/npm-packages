/** @jsxImportSource @mpen/jsxhtml */
import type {InputAttributes} from '../htmlspec/elements'

/**
 * `<input type="tel">`.
 */
export function TelephoneInput(props: Omit<InputAttributes, 'type' | 'checked'>) {
    return <input {...props} type="tel" />
}
