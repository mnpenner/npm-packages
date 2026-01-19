import type {MediaType} from '../types'

function normalizeToken(value: string): string {
    return value.trim()
}

function normalizeType(value: string): string {
    return normalizeToken(value).toLowerCase()
}

export function normalizeCharset(value: string): string {
    return normalizeToken(value).toLowerCase().replace(/[-_]/g, '')
}

export function normalizeMediaType(value: MediaType): MediaType {
    const type = normalizeType(value.type)
    const charset = value.charset ? normalizeToken(value.charset) : undefined
    const boundary = value.boundary ? normalizeToken(value.boundary) : undefined
    const q = value.q
    return {
        type,
        ...(charset ? {charset} : {}),
        ...(boundary ? {boundary} : {}),
        ...(q !== undefined ? {q} : {}),
    }
}

export function parseMediaType(value: string): MediaType | null {
    const [typePart = '', ...params] = value.split(';')
    const type = normalizeType(typePart)
    if (!type) return null

    let charset: string | undefined
    let boundary: string | undefined
    let q: number | undefined
    for (const param of params) {
        const [rawKey, ...rest] = param.split('=')
        if (!rawKey || rest.length === 0) continue
        const key = rawKey.trim().toLowerCase()
        let paramValue = rest.join('=').trim()
        if (paramValue.startsWith('"') && paramValue.endsWith('"')) {
            paramValue = paramValue.slice(1, -1)
        }
        if (key === 'charset') charset = paramValue
        if (key === 'boundary') boundary = paramValue
        if (key === 'q') {
            const parsed = Number.parseFloat(paramValue)
            if (!Number.isNaN(parsed)) q = parsed
        }
    }

    return {
        type,
        ...(charset ? {charset} : {}),
        ...(boundary ? {boundary} : {}),
        ...(q !== undefined ? {q} : {}),
    }
}

/**
 * Parse an Accept header into quality-sorted media types.
 *
 * @param value - Accept header value to parse.
 * @returns Media types sorted by descending `q` values, preserving original order for ties.
 */
export function parseAcceptHeader(value: string): MediaType[] {
    const entries: Array<{media: MediaType; index: number}> = []
    for (const [index, entry] of value.split(',').entries()) {
        const parsed = parseMediaType(entry.trim())
        if (!parsed) continue
        const q = parsed.q ?? 1
        entries.push({media: {...parsed, q}, index})
    }

    entries.sort((a, b) => {
        const qA = a.media.q ?? 1
        const qB = b.media.q ?? 1
        if (qB !== qA) return qB - qA
        return a.index - b.index
    })

    return entries.map(entry => entry.media)
}

export function mediaTypeMatches(accept: MediaType, contentType: MediaType): boolean {
    const normalizedAccept = normalizeMediaType(accept)
    const normalizedContent = normalizeMediaType(contentType)
    if (normalizedAccept.type !== normalizedContent.type) return false
    if (normalizedAccept.charset && normalizedContent.charset) {
        if (normalizeCharset(normalizedAccept.charset) !== normalizeCharset(normalizedContent.charset)) return false
    }
    if (normalizedAccept.boundary && normalizedContent.boundary) {
        if (normalizedAccept.boundary !== normalizedContent.boundary) return false
    }
    return true
}
