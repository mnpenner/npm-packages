import type {InputAttributes} from '../htmlspec/elements'

/**
 * `<input type="checkbox">`.
 */
export function Checkbox(props: Omit<InputAttributes, 'type'>) {
    return <input {...props} type="checkbox" />
}
