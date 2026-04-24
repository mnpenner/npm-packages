#!/usr/bin/env -S bun test
import {describe, expect, it} from 'bun:test'
import util from 'node:util'
import {err, ok} from './result.ts'

describe('Result toString', () => {
    it('stringifies Ok payloads with structured data', () => {
        const result = ok({id: 1, name: 'Ada'})

        expect(result.toString()).toBe('Ok({"id":1,"name":"Ada"})')
    })

    it('stringifies Err payloads and preserves error messages', () => {
        const failure = err(new Error('boom'))

        expect(failure.toString()).toBe('Err(Error: boom)')
    })

    it('quotes string payloads', () => {
        expect(ok('hi').toString()).toBe('Ok("hi")')
        expect(err('bad').toString()).toBe('Err("bad")')
    })

    it('registers util.inspect hooks when the custom symbol is available', () => {
        const options = {customInspect: true} as const
        const okLabel = util.styleText ? util.styleText('green', 'Ok') : 'Ok'
        const errLabel = util.styleText ? util.styleText('red', 'Err') : 'Err'

        expect(util.inspect(ok('hi'), options)).toBe(`${okLabel}('hi')`)
        expect(util.inspect(err('bad'), options)).toBe(`${errLabel}('bad')`)
    })
})
