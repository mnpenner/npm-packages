#!/usr/bin/env -S bun test
import {describe, expect, it} from 'bun:test'
import {joinPrefixPathname, stripPrefixPathname} from './pathname'

describe('pathname helpers', function () {
    it('joins prefixes and pathnames', function () {
        expect(joinPrefixPathname('', '/items')).toBe('/items')
        expect(joinPrefixPathname('api', 'items')).toBe('/api/items')
        expect(joinPrefixPathname('/api/', '/items')).toBe('/api/items')
        expect(joinPrefixPathname('/api', '/')).toBe('/api')
    })

    it('strips prefixes from pathnames', function () {
        expect(stripPrefixPathname('/api', '/api/items')).toBe('/items')
        expect(stripPrefixPathname('/api', '/api')).toBe('/')
        expect(stripPrefixPathname('/api', '/other')).toBe(null)
    })
})
