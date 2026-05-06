import { describe, expect, test } from 'bun:test'
import { mergeSearch } from './mergeSearch'

describe(mergeSearch.name, () => {
    test('adds search params to a path without a query string', () => {
        expect(mergeSearch('/matches', { page: 2, archived: false })).toBe(
            '/matches?page=2&archived=false',
        )
    })

    test('overwrites matching params and keeps unrelated existing params', () => {
        expect(mergeSearch('/matches?page=1&sort=asc', { page: 2 })).toBe(
            '/matches?page=2&sort=asc',
        )
    })

    test('preserves hash fragments after the merged query string', () => {
        expect(mergeSearch('/matches?page=1#details', { page: 2, tab: 'stats' })).toBe(
            '/matches?page=2&tab=stats#details',
        )
    })

    test('adds search params before a hash fragment when no query string exists', () => {
        expect(mergeSearch('/matches#details', { tab: 'stats' })).toBe('/matches?tab=stats#details')
    })

    test('accepts URLSearchParams and tuple search params', () => {
        expect(mergeSearch('/matches?filter=open', new URLSearchParams('filter=all'))).toBe(
            '/matches?filter=all',
        )
        expect(mergeSearch('/matches', [['filter', 'open']])).toBe('/matches?filter=open')
    })

    test('encodes merged params using URLSearchParams serialization', () => {
        expect(mergeSearch('/matches?q=old', { q: 'hello world' })).toBe('/matches?q=hello+world')
    })
})
