import { describe, expect, it } from 'bun:test'
import { jsonAscii } from './json.ts'

describe(jsonAscii.name, () => {
    it('serializes non-json data types without throwing', () => {
        const symbol = Symbol('visible')
        const circular: Record<string, unknown> = { ok: true }
        circular.self = circular

        const error = new TypeError('bad input')
        error.stack = 'TypeError: bad input'
        const cause = new Error('root cause')
        cause.stack = 'Error: root cause'
        error.cause = cause
        ;(error as Error & { code: string }).code = 'BAD_INPUT'

        const firstAggregateError = new Error('first failure')
        firstAggregateError.stack = 'Error: first failure'
        const aggregateError = new AggregateError(
            [firstAggregateError, 'second failure'],
            'many failures',
        )
        aggregateError.stack = 'AggregateError: many failures'

        const value = {
            ascii: 'ok',
            unicode: 'thr\u{1f600}ee \u26a0',
            undefined: undefined,
            function: function double(value: number) {
                return value * 2
            },
            symbol,
            safeBigint: 42n,
            unsafeBigint: 9_007_199_254_740_993n,
            date: new Date('2026-05-16T12:34:56.000Z'),
            invalidDate: new Date('not a date'),
            regexp: /abc/gi,
            boxed: new String('wrapped'),
            set: new Set([1, 2n, 'three']),
            map: new Map<unknown, unknown>([
                ['one', 1],
                [2, 2n],
                [Symbol.for('key'), 'symbol key'],
            ]),
            error,
            aggregateError,
            bytes: new Uint8Array([1, 2, 255]),
            buffer: new Uint8Array([3, 4]).buffer,
            weakMap: new WeakMap(),
            weakSet: new WeakSet(),
            promise: Promise.resolve(1),
            circular,
        }

        const json = jsonAscii(value)

        expect(json).not.toMatch(/[^\x00-\x7F]/u)
        expect(JSON.parse(json)).toEqual({
            ascii: 'ok',
            unicode: 'thr\u{1f600}ee \u26a0',
            undefined: '[undefined]',
            function: '[Function: double]',
            symbol: 'Symbol(visible)',
            safeBigint: 42,
            unsafeBigint: '9007199254740993',
            date: '2026-05-16T12:34:56.000Z',
            invalidDate: '[Invalid Date]',
            regexp: '/abc/gi',
            boxed: 'wrapped',
            set: [1, 2, 'three'],
            map: {
                one: 1,
                '2': 2,
                'Symbol(key)': 'symbol key',
            },
            error: {
                code: 'BAD_INPUT',
                name: 'TypeError',
                message: 'bad input',
                stack: 'TypeError: bad input',
                cause: {
                    name: 'Error',
                    message: 'root cause',
                    stack: 'Error: root cause',
                },
            },
            aggregateError: {
                name: 'AggregateError',
                message: 'many failures',
                stack: 'AggregateError: many failures',
                errors: [
                    expect.objectContaining({
                        name: 'Error',
                        message: 'first failure',
                    }),
                    'second failure',
                ],
            },
            bytes: [1, 2, 255],
            buffer: [3, 4],
            weakMap: '[WeakMap]',
            weakSet: '[WeakSet]',
            promise: '[Promise]',
            circular: {
                ok: true,
                self: '[Circular]',
            },
        })
    })
})
