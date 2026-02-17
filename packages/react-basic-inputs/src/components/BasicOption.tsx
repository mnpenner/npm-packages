import type {OverrideProps} from '../types/utility.ts'

export type BasicOptionProps<T> = OverrideProps<'option', {
    value: T
}>

/**
 * Like a normal <option> but `value` can be anything and won't appear in the DOM.
 * Use with <BasicSelect>.
 */
export function BasicOption<T>({value, ...props}: BasicOptionProps<T>) {
    return <option {...props} />
}

BasicOption.__is$option = true
