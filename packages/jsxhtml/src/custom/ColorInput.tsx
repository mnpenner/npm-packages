import type {InputAttributes} from '../htmlspec/elements'

/**
 * `<input type="color">`.
 */
export function ColorInput(props: Omit<InputAttributes, 'type' | 'checked'>) {
    return <input {...props} type="color" />
}
