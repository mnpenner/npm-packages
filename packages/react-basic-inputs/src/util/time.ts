import {pad0} from './format.ts'

export type IsoDateOptions = {
    seconds?: boolean
    milliseconds?: boolean
    offset?: boolean
}

export function toIsoDateString(date: number | Date | string, options?: IsoDateOptions): string {
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
        const offset = -d.getTimezoneOffset()
        const sign = offset >= 0 ? '+' : '-'
        const offsetHours = Math.floor(Math.abs(offset) / 60)
        const offsetMinutes = Math.abs(offset) % 60

        str += `${sign}${pad0(offsetHours)}:${pad0(offsetMinutes)}`
    }

    return str
}
