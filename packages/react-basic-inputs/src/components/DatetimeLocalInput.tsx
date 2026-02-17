import type {ChangeEventHandler} from 'react'
import type { OverrideProps} from "../types/utility";
import {assumeProps} from '../util/assert.ts'
import type {DateValue, IsoDateOptions} from '../util/time.ts';
import { toIsoDateString} from '../util/time.ts'

export type DatetimeLocalInputChangeEvent = {
    value: string
    date: Date | null
    isoString: string
}


export type DatetimeLocalInputProps = OverrideProps<'input', {
    min?: DateValue
    max?: DateValue
    value?: DateValue|null
    defaultValue?: DateValue
    onChange?: (ev: DatetimeLocalInputChangeEvent) => void
    // includeSeconds?: boolean
    // includeMilliseconds?: boolean
}, 'type'>


const DATE_INPUT_OPTIONS: IsoDateOptions = {offset: false}

export function DatetimeLocalInput({value, defaultValue, min, max, onChange, ...props}: DatetimeLocalInputProps) {
    assumeProps<'input'>(props)
    const valueProp = value !== undefined ? (value === null ? '' : toIsoDateString(value, DATE_INPUT_OPTIONS)) : props.value
    const defaultValueProp = defaultValue != null ? toIsoDateString(defaultValue, DATE_INPUT_OPTIONS) : props.defaultValue
    const minProp = min != null ? toIsoDateString(min, DATE_INPUT_OPTIONS) : props.min
    const maxProp = max != null ? toIsoDateString(max, DATE_INPUT_OPTIONS) : props.max
    const handleChange: ChangeEventHandler<HTMLInputElement> | undefined = onChange == null
        ? props.onChange
        : (ev) => {
            const value = ev.currentTarget.value
            const date = value === '' ? null : new Date(value)
            onChange({
                value,
                date: date != null && !Number.isNaN(+date) ? date : null,
                isoString: date != null && !Number.isNaN(+date) ? date.toISOString() : '',
            })
        }

    return <input type="datetime-local" {...props} value={valueProp} defaultValue={defaultValueProp} min={minProp} max={maxProp} onChange={handleChange} />
}
