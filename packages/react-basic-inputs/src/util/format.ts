import {nil} from "../types/utility";

export function collapseWhitespace(str: string | nil): string {
    if(!str) return ''
    return String(str).replace(/\s+/gu, ' ').trim()
}

export function formatEmail(str: string | nil): string {
    if(!str) return ''
    return String(str).replace(/\s+/gu, '').toLowerCase()
}

export function formatUrl(str: string | nil): string {
    if(!str) return ''
    str = String(str).trim()
    const endSlash = str.endsWith('/')
    if(!/^\w[-\w]*:/.test(str)) {
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

export function fullWide(n: number): string {
    try {
        return n.toLocaleString('en-US', {useGrouping: false, maximumFractionDigits: 20})
    } catch {
        return n.toFixed(14).replace(/\.?0+$/, '')
    }
}

export function formatUsername(str: string | nil) {
    if (!str) return ''
    return String(str).replace(/\s+/gu, '').toLowerCase()
}
