import type {InputAttributes} from '../htmlspec/elements'

/**
 * `<input type="number">`.
 */
export function NumberInput(props: Omit<InputAttributes, 'type' | 'checked'>) {
    return <input {...props} type="number" />
}
