#!/usr/bin/env -S bun test
import {describe, expect, it} from 'bun:test'
import {varDump} from './var-dump.ts'
import {err, ok} from './result.ts'

describe(varDump.name, () => {
    it('stringifies typed arrays with constructor name and values', () => {
        const typed = new Uint16Array([10, 20, 30])

        expect(varDump(typed)).toBe('Uint16Array[10,20,30]')
    })

    it('reports DataView byte length', () => {
        const view = new DataView(new ArrayBuffer(12), 4, 4)

        expect(varDump(view)).toBe('DataView(4)')
    })

    it('stringifies nested Map and Set structures', () => {
        const payload = new Map([
            ['ids', new Set([1, 2, 3])],
        ])

        expect(varDump(payload)).toBe('Map{"ids"=>Set{1,2,3}}')
    })

    it('prefers custom toString implementations before JSON stringification', () => {
        const payload = {
            a: 1,
            toString: () => 'custom-string',
        }

        expect(varDump(payload)).toBe('custom-string')
    })

    it('stringifies arrays with nested custom stringifiable entries', () => {
        const payload = [ok('a'), err('boom')]

        expect(varDump(payload)).toBe('[Ok("a"),Err("boom")]')
    })

    it('stringifies plain objects with nested Results', () => {
        const payload = {
            user: ok({id: 1}),
            profile: err('missing'),
        }

        expect(varDump(payload)).toBe('{"user":Ok({"id":1}),"profile":Err("missing")}')
    })
})
