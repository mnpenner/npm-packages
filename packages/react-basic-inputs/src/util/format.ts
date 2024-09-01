import {nil} from "../types/utility";

export function collapseWhitespace(str: string | nil): string {
    if (!str) return ''
    return String(str).replace(/\s+/gu, ' ').trim()
}

export function formatEmail(str: string | nil): string {
    if (!str) return ''
    return String(str).replace(/\s+/gu, '').toLowerCase()
}

export function formatUrl(str: string | nil): string {
    if (!str) return ''
    str = String(str).trim()
    const endSlash = str.endsWith('/')
    if (!/^\w[-\w]*:/.test(str)) {
        str = 'https://' + str
    }
    try {
        let href = new URL(str).href
        if (!endSlash) {
            href = href.replace(/\/$/, '')
        }
        return href
    } catch {
        return str
    }
}

// export function parseFloat<TDefault>(nbr: string | number, defaultValue: TDefault): number | TDefault
// export function parseFloat(nbr: string | number): number | null
// export function parseFloat(nbr: string | number, defaultValue: any = null): number | null {
//     if (nbr == null || nbr === '') return defaultValue
//     const val = globalThis.parseFloat(nbr as string)
//     return Number.isFinite(val) ? val : defaultValue
// }

export function fullWide(n: number): string {
    try {
        return n.toLocaleString('en-US', {useGrouping: false, maximumFractionDigits: 20})
    } catch {
        return n.toFixed(14).replace(/\.?0+$/, '')
    }
}

export function stringToNumber(n: string): number {
    // n = String(n).trim().toLowerCase()
    if (!n) return Number.NaN
    if (n === '∞' || n === '+∞') return Number.POSITIVE_INFINITY
    if (n === '-∞') return Number.NEGATIVE_INFINITY
    return Number.parseFloat(n)
}

export function numberToString(f: number): string {
    if (Number.isNaN(f)) return ''
    if (f === Number.POSITIVE_INFINITY) return '∞'
    if (f === Number.NEGATIVE_INFINITY) return '-∞'
    return fullWide(f)
}

export function formatStrNumber(n: string): string {
    if (!n) return ''
    return numberToString(Number.parseFloat(n))
}

export function formatUsername(str: string | nil) {
    if (!str) return ''
    return String(str).replace(/\s+/gu, '').toLowerCase()
}


export function pad0(num: number, count=2) {
    return String(num).padStart(count, '0')
}

export function toDateInputValue(date: number|Date|string): string {
    // if(typeof date === 'string') return date
    const d = new Date(date)
    let str = `${d.getFullYear()}-${pad0(d.getMonth()+1)}-${pad0(d.getDate())}T${pad0(d.getHours())}:${pad0(d.getMinutes())}`
    if(d.getSeconds() !== 0 || d.getMilliseconds() !== 0) {
        str += ':'+pad0(d.getSeconds())
        if(d.getMilliseconds() !== 0) {
            str += '.'+pad0(d.getMilliseconds(),3)
        }
    }
    return str
}
