#!/usr/bin/env -S bun test
import {describe, expect, it} from 'bun:test'
import {mediaTypeMatches, normalizeCharset, parseMediaType} from './media-type'

describe(parseMediaType.name, function () {
    it('parses types with parameters', function () {
        const media = parseMediaType('multipart/form-data; boundary=abc; charset=UTF-8')
        expect(media).toEqual({
            type: 'multipart/form-data',
            boundary: 'abc',
            charset: 'UTF-8',
        })
    })

    it('parses quoted parameters', function () {
        const media = parseMediaType('multipart/form-data; boundary="xyz-123"')
        expect(media).toEqual({
            type: 'multipart/form-data',
            boundary: 'xyz-123',
        })
    })

    it('parses with no parameters', function () {
        const media = parseMediaType('application/json')
        expect(media).toEqual({
            type: 'application/json',
        })
    })
})

describe(normalizeCharset.name, function () {
    it('normalizes charset tokens', function () {
        expect(normalizeCharset('utf8')).toBe('utf8')
        expect(normalizeCharset('UTF-8')).toBe('utf8')
        expect(normalizeCharset('utf_8')).toBe('utf8')
    })

    it('matches types and charsets when compatible', function () {
        const accept = parseMediaType('application/json; charset=utf-8')!
        const contentType = parseMediaType('application/json; charset=UTF8')!
        expect(mediaTypeMatches(accept, contentType)).toBe(true)
    })

    it('matches when charset is missing on either side', function () {
        const accept = parseMediaType('application/json; charset=utf-8')!
        const contentType = parseMediaType('application/json')!
        expect(mediaTypeMatches(accept, contentType)).toBe(true)
        expect(mediaTypeMatches(contentType, accept)).toBe(true)
    })

    it('rejects mismatched media types', function () {
        const accept = parseMediaType('application/json')!
        const contentType = parseMediaType('text/plain')!
        expect(mediaTypeMatches(accept, contentType)).toBe(false)
    })
})
