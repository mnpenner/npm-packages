#!/usr/bin/env -S bun test
import { describe, expect, it } from 'bun:test'
import { fullWide } from './format'

describe(fullWide.name, () => {
    it('formats finite numbers without grouping or exponential notation', () => {
        expect(fullWide(1234567)).toBe('1234567')
        expect(fullWide(1e21)).toBe('1000000000000000000000')
        expect(fullWide(1234.5)).toBe('1234.5')
        expect(fullWide(0.0000001)).toBe('0.0000001')
    })

    it('formats bigint values as base-10 strings', () => {
        expect(fullWide(123_456_789_012_345_678_901_234_567_890n)).toBe(
            '123456789012345678901234567890',
        )
    })

    it('trims leading zeroes', () => {
        expect(fullWide('000123')).toBe('123')
        expect(fullWide('+000123')).toBe('123')
        expect(fullWide('-000123')).toBe('-123')
    })

    it('trims trailing zeros zeroes', () => {
        expect(fullWide('1230')).toBe('1230')
        expect(fullWide('1230.')).toBe('1230')
        expect(fullWide('1230.0')).toBe('1230')
        expect(fullWide('1230.01')).toBe('1230.01')
        expect(fullWide('1230.010')).toBe('1230.01')
        expect(fullWide('1230.010200')).toBe('1230.0102')

        expect(fullWide('+1230')).toBe('1230')
        expect(fullWide('+1230.')).toBe('1230')
        expect(fullWide('+1230.0')).toBe('1230')
        expect(fullWide('+1230.01')).toBe('1230.01')
        expect(fullWide('+1230.010')).toBe('1230.01')

        expect(fullWide('-1230')).toBe('-1230')
        expect(fullWide('-1230.')).toBe('-1230')
        expect(fullWide('-1230.0')).toBe('-1230')
        expect(fullWide('-1230.01')).toBe('-1230.01')
        expect(fullWide('-1230.010')).toBe('-1230.01')
    })

    it('formats decimal strings without losing precision', () => {
        expect(fullWide('0.000000000000000001')).toBe('0.000000000000000001')
        expect(fullWide('123456789012345678901234567890.125')).toBe(
            '123456789012345678901234567890.125',
        )
    })

    it('returns safe integer bounds for infinite numeric values', () => {
        expect(fullWide(Number.POSITIVE_INFINITY)).toBe(String(Number.MAX_SAFE_INTEGER))
        expect(fullWide(Number.NEGATIVE_INFINITY)).toBe(String(Number.MIN_SAFE_INTEGER))
    })

    it('returns zero for NaN numeric values', () => {
        expect(fullWide(Number.NaN)).toBe('0')
    })

    it('returns safe integer bounds for infinite string values', () => {
        expect(fullWide('Infinity')).toBe(String(Number.MAX_SAFE_INTEGER))
        expect(fullWide('+Infinity')).toBe(String(Number.MAX_SAFE_INTEGER))
        expect(fullWide('-Infinity')).toBe(String(Number.MIN_SAFE_INTEGER))
    })
})
