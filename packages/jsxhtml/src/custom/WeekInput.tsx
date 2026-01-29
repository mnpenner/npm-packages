import type {InputAttributes} from '../htmlspec/elements'

/**
 * `<input type="week">`.
 */
export function WeekInput(props: Omit<InputAttributes, 'type' | 'checked'>) {
    return <input {...props} type="week" />
}
