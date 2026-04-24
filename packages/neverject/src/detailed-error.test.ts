#!/usr/bin/env -S bun test
import {describe, expect, it} from "bun:test"
import {toDetailedError} from './detailed-error.ts'

describe('toDetailedError stringification', () => {
    it('keeps a short single-line reason without ellipsis', () => {
        const error = toDetailedError('simple')

        expect(error).toBeInstanceOf(Error)
        expect(error.message).toBe('Rejected Promise: simple')
        expect(error.details).toBe('simple')
    })

    it('respects a custom toString implementation', () => {
        const reason = {
            value: 42,
            toString() {
                return 'custom stringify'
            },
        }

        const error = toDetailedError(reason)

        expect(error.message).toBe('Rejected Promise: custom stringify')
        expect(error.details).toBe(reason)
    })

    it('uses only the first line and appends ellipsis when truncating extra lines', () => {
        const reason = 'first line\nsecond line\nthird line'
        const error = toDetailedError(reason)

        expect(error.message).toBe('Rejected Promise: first line')
        expect(error.details).toBe(reason)
    })

    it('caps the message to 200 characters and appends ellipsis when trimmed', () => {
        const longLine = 'x'.repeat(250)
        const prefix = 'Rejected Promise: '
        const expected = `${prefix}${longLine.slice(0, 197 - prefix.length)}...`

        const error = toDetailedError(longLine)

        expect(error.message).toBe(expected)
        expect(error.details).toBe(longLine)
    })
})
