import type {URLPattern} from 'urlpattern-polyfill'

function sanitizeNamePart(part: string): string {
    const replaced = part.replace(/:([a-zA-Z_$][a-zA-Z0-9_$]*)/g, '$$$1')
    const cleaned = replaced.replace(/[^a-zA-Z0-9_$]/g, '')
    if (cleaned.length === 0) return 'index'
    if (!/^[a-zA-Z_$]/.test(cleaned)) return '_' + cleaned
    return cleaned
}

export function sanitizeNameParts(parts: string[]): string[] {
    return parts.map(sanitizeNamePart).filter(Boolean)
}

export function splitNameString(name: string): string[] {
    const parts: string[] = []
    let current = ''
    let escaping = false

    for (const char of name) {
        if (escaping) {
            current += char
            escaping = false
            continue
        }
        if (char === '\\') {
            escaping = true
            continue
        }
        if (char === '.') {
            parts.push(current)
            current = ''
            continue
        }
        current += char
    }
    parts.push(current)

    return parts.filter(p => p.length > 0)
}

function upperFirst(str: string): string {
    return str.slice(0, 1).toUpperCase() + str.slice(1)
}

function lowerFirst(str: string): string {
    return str.slice(0, 1).toLowerCase() + str.slice(1)
}

function segmentToDefaultName(segment: string): string {
    const paramMatch = segment.match(/^:([a-zA-Z0-9_]+)(?:\\(.+\\))?$/)
    if (paramMatch) {
        const key = paramMatch[1]
        if (key) return 'By' + upperFirst(key)
    }

    const cleaned = segment.split(/[^a-zA-Z0-9]+/).filter(Boolean)
    if (cleaned.length === 0) return 'Index'
    return cleaned.map(upperFirst).join('')
}

export function pattToName(_method: string, patt: URLPattern): string[] {
    const pathname = patt.pathname
    const parts = pathname.split('/').filter(p => p.length > 0)

    if (parts.length === 0) {
        return []
    }

    const combined = parts.map(segmentToDefaultName).join('')
    return sanitizeNameParts([lowerFirst(combined)])
}
