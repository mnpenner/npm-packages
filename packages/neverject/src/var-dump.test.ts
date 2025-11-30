#!/usr/bin/env -S bun test
import {describe, expect, it} from 'bun:test'
import {stringifyPayload} from './var-dump.ts'

describe('stringifyPayload', () => {
    it('stringifies typed arrays with constructor name and values', () => {
        const typed = new Uint16Array([10, 20, 30])

        expect(stringifyPayload(typed)).toBe('Uint16Array[10,20,30]')
    })

    it('reports DataView byte length', () => {
        const view = new DataView(new ArrayBuffer(12), 4, 4)

        expect(stringifyPayload(view)).toBe('DataView(4)')
    })

    it('stringifies nested Map and Set structures', () => {
        const payload = new Map([
            ['ids', new Set([1, 2, 3])],
        ])

        expect(stringifyPayload(payload)).toBe('Map{"ids"=>Set{1,2,3}}')
    })
})
