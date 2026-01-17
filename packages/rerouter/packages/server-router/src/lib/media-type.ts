import type {MediaType} from '../types'

const normalizeToken = (value: string): string => value.trim()

const normalizeType = (value: string): string => normalizeToken(value).toLowerCase()

export const normalizeCharset = (value: string): string =>
    normalizeToken(value).toUpperCase().replace(/[-_]/g, '')

export const normalizeMediaType = (value: MediaType): MediaType => {
    const type = normalizeType(value.type)
    const charset = value.charset ? normalizeToken(value.charset) : undefined
    const boundary = value.boundary ? normalizeToken(value.boundary) : undefined
    return {
        type,
        ...(charset ? {charset} : {}),
        ...(boundary ? {boundary} : {}),
    }
}

export const parseMediaType = (value: string): MediaType | null => {
    const [typePart, ...params] = value.split(';')
    const type = normalizeType(typePart)
    if (!type) return null

    let charset: string | undefined
    let boundary: string | undefined
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
    }

    return {
        type,
        ...(charset ? {charset} : {}),
        ...(boundary ? {boundary} : {}),
    }
}

export const mediaTypeMatches = (accept: MediaType, contentType: MediaType): boolean => {
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
