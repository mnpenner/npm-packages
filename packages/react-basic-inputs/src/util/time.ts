import {pad0} from './format.ts'
import {nil} from '../types/utility.ts'

export type IsoDateOptions = {
    seconds?: boolean
    milliseconds?: boolean
    offset?: boolean
}

export type DateValue = number | string | Date

export function toIsoDateString(date: DateValue, options?: IsoDateOptions): string {
    const d = new Date(date)
    let str = `${d.getFullYear()}-${pad0(d.getMonth() + 1)}-${pad0(d.getDate())}T${pad0(d.getHours())}:${pad0(d.getMinutes())}`

    const showMs = options?.milliseconds || (options?.milliseconds == null && d.getMilliseconds() !== 0)
    const showSec = options?.seconds || (options?.seconds == null && (d.getSeconds() !== 0 || showMs))

    if(showSec) {
        str += `:${pad0(d.getSeconds())}`
        if(showMs) {
            str += `.${pad0(d.getMilliseconds(), 3)}`
        }
    }

    if(options?.offset) {
        // https://en.wikipedia.org/wiki/ISO_8601#Time_zone_designators
        str += minutesToOffset(-d.getTimezoneOffset())
    }

    return str
}

export function minutesToOffset(offset: number | nil): string {
    if(offset == null) return ''
    if(offset === 0) return 'Z'
    const sign = offset > 0 ? '+' : '-'
    const offsetHours = Math.floor(Math.abs(offset) / 60)
    const offsetMinutes = Math.abs(offset) % 60
    return `${sign}${pad0(offsetHours)}:${pad0(offsetMinutes)}`
}

const DATE_INPUT_OPTIONS: IsoDateOptions = {offset: false}

export function isInvalidDateInput(date: DateValue | nil): date is nil | '' {
    return date == null || Number.isNaN(date) || date === '' || Number.isNaN(+new Date(date))
}

export function toDateInputValue(date: DateValue | nil): string {
    if(isInvalidDateInput(date)) return ''
    return toIsoDateString(date, DATE_INPUT_OPTIONS)
}
