import type {InputAttributes} from '../htmlspec/elements'

/**
 * `<input type="time">`.
 */
export function TimeInput(props: Omit<InputAttributes, 'type' | 'checked'>) {
    return <input {...props} type="time" />
}
