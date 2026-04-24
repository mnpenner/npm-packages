#!/usr/bin/env -S bun test
import {describe, expect, it} from 'bun:test'
import {mediaTypeMatches, parseAcceptHeader, parseMediaType} from './media-type'

describe(parseMediaType.name, function () {
    it('parses types with parameters', function () {
        const media = parseMediaType('multipart/form-data; boundary=abc; charset=UTF-8')
        expect(media).toEqual({
            type: 'multipart/form-data',
            boundary: 'abc',
            charset: 'utf-8',
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

    it('parses q parameters', function () {
        const media = parseMediaType('application/json; q=0.7')
        expect(media).toEqual({
            type: 'application/json',
            q: 0.7,
        })
    })
})

describe(mediaTypeMatches.name, function () {
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

describe(parseAcceptHeader.name, function () {
    it('sorts by descending q and preserves order for ties', function () {
        const accept = parseAcceptHeader(
            'text/plain;q=0.5, application/json, text/html;q=0.9, image/png;q=0.9',
        )
        expect(accept).toEqual([
            {type: 'application/json', q: 1},
            {type: 'text/html', q: 0.9},
            {type: 'image/png', q: 0.9},
            {type: 'text/plain', q: 0.5},
        ])
    })
})
