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
