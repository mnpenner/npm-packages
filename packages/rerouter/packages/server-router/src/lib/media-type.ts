import type {MediaType} from '../types'
import {normalizeCharsetName} from './charset'

function normalizeToken(value: string): string {
    return value.trim()
}

function normalizeType(value: string): string {
    return normalizeToken(value).toLowerCase()
}

export function normalizeMediaType(value: MediaType): MediaType {
    const type = normalizeType(value.type)
    const charset = value.charset ? normalizeCharsetName(value.charset) : undefined
    const boundary = value.boundary ? normalizeToken(value.boundary) : undefined
    const q = value.q
    const result: MediaType = {type}
    if(charset) result.charset = charset
    if(boundary) result.boundary = boundary
    if(q !== undefined) result.q = q
    return result
}

export function parseMediaType(value: string): MediaType | null {
    const [typePart = '', ...params] = value.split(';')
    const type = normalizeType(typePart)
    if(!type) return null

    const result: MediaType = {type}
    for(const param of params) {
        const [rawKey, rawValue] = param.split('=', 2)
        if(!rawKey || !rawValue) continue
        const key = rawKey.trim().toLowerCase()
        let paramValue = rawValue.trim()
        if(paramValue.startsWith('"') && paramValue.endsWith('"')) {
            paramValue = paramValue.slice(1, -1)
        }
        if(key === 'charset') result.charset = normalizeCharsetName(paramValue)
        if(key === 'boundary') result.boundary = paramValue
        if(key === 'q') {
            const parsed = Number.parseFloat(paramValue)
            if(!Number.isNaN(parsed)) result.q = parsed
        }
    }

    return result
}

/**
 * Parse an Accept header into quality-sorted media types.
 *
 * @param value - Accept header value to parse.
 * @returns Media types sorted by descending `q` values, preserving original order for ties.
 */
export function parseAcceptHeader(value: string): MediaType[] {
    const entries: Array<{ media: MediaType; index: number }> = []
    for(const [index, entry] of value.split(',').entries()) {
        const parsed = parseMediaType(entry.trim())
        if(!parsed) continue
        const q = parsed.q ?? 1
        entries.push({media: {...parsed, q}, index})
    }

    entries.sort((a, b) => {
        const qA = a.media.q ?? 1
        const qB = b.media.q ?? 1
        if(qB !== qA) return qB - qA
        return a.index - b.index
    })

    return entries.map(entry => entry.media)
}

export function mediaTypeMatches(accept: MediaType, contentType: MediaType): boolean {
    const normalizedAccept = normalizeMediaType(accept)
    const normalizedContent = normalizeMediaType(contentType)
    if(normalizedAccept.type !== normalizedContent.type) return false
    if(normalizedAccept.charset && normalizedContent.charset) {
        if(normalizeCharsetName(normalizedAccept.charset) !== normalizeCharsetName(normalizedContent.charset)) return false
    }
    if(normalizedAccept.boundary && normalizedContent.boundary) {
        if(normalizedAccept.boundary !== normalizedContent.boundary) return false
    }
    return true
}
