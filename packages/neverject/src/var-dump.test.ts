#!/usr/bin/env -S bun test
import {describe, expect, it} from 'bun:test'
import {varDump} from './var-dump.ts'

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
})
