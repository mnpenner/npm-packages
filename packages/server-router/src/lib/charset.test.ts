#!/usr/bin/env -S bun test
import {describe, expect, it} from 'bun:test'
import {normalizeCharsetName} from './charset'

describe(normalizeCharsetName.name, () => {
    it('returns preferred MIME names for common aliases', () => {
        expect(normalizeCharsetName('UTF8')).toBe('utf-8')
        expect(normalizeCharsetName('latin1')).toBe('iso-8859-1')
        expect(normalizeCharsetName('ANSI_X3.4-1968')).toBe('us-ascii')
    })

    it('ignores punctuation and whitespace differences', () => {
        expect(normalizeCharsetName(' utf_16 ')).toBe('utf-16')
        expect(normalizeCharsetName('utf 8')).toBe('utf-8')
        expect(normalizeCharsetName('Shift-JIS')).toBe('shift_jis')
    })

    it('returns an empty string for missing input', () => {
        expect(normalizeCharsetName('')).toBe('')
        expect(normalizeCharsetName('   ')).toBe('')
    })
})
