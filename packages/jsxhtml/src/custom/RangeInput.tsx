/** @jsxImportSource @mpen/jsxhtml */
import type {InputAttributes} from '../htmlspec/elements'

/**
 * `<input type="range">`.
 */
export function RangeInput(props: Omit<InputAttributes, 'type' | 'checked'>) {
    return <input {...props} type="range" />
}
