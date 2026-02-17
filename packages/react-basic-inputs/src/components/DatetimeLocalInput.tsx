import {HtmlSelectElement, OmitProps, OverrideProps} from "../types/utility"
import {assumeProps} from '../util/assert.ts'
import {DateValue, IsoDateOptions, toIsoDateString} from '../util/time.ts'

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
    if(value !== undefined) props.value = value === null ? '' : toIsoDateString(value, DATE_INPUT_OPTIONS)
    if(defaultValue != null) props.defaultValue = toIsoDateString(defaultValue, DATE_INPUT_OPTIONS)
    if(min != null) props.min = toIsoDateString(min, DATE_INPUT_OPTIONS)
    if(max != null) props.max = toIsoDateString(max, DATE_INPUT_OPTIONS)
    if(onChange != null) {
        props.onChange = ev => {
            const value = ev.currentTarget.value
            const date = value === '' ? null : new Date(value)
            onChange({
                value,
                date: date != null && !Number.isNaN(+date) ? date : null,
                isoString: date != null && !Number.isNaN(+date) ? date.toISOString() : '',
            })
        }
    }
    return <input type="datetime-local" {...props} />
}
