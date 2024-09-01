import {OmitProps, OverrideProps} from "../types/utility"
import {assumeProps} from '../util/assert.ts'
import {toDateInputValue} from '../util/format.ts'

export type DatetimeLocalInputProps = OverrideProps<'input', {
    min?: number | string | Date
    max?: number | string | Date
    value?: number | string | Date
    defaultValue?: number | string | Date
    // includeSeconds?: boolean
    // includeMilliseconds?: boolean
}, 'type'>


export function DatetimeLocalInput({value, defaultValue, min, max, ...props}: DatetimeLocalInputProps) {
    assumeProps<'input'>(props)
    if(value != null) props.value = toDateInputValue(value)
    if(defaultValue != null) props.defaultValue = toDateInputValue(defaultValue)
    if(min != null) props.min = toDateInputValue(min)
    if(max != null) props.max = toDateInputValue(max)
    return <input type="datetime-local" {...props} />
}

