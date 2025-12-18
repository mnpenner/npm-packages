#!/usr/bin/env -S bun test
import {describe, expect, it} from 'bun:test'
import {kitchenSink, home, login, match} from './routes.gen'

describe('routes.gen', () => {
    it('home()', () => {
        expect(home()).toBe('/')
    })

    it('login()', () => {
        expect(login()).toBe('/login')
    })

    it('match()', () => {
        expect(match({id: '123'})).toBe('/matches/123')
    })

    it('match() uses encodeURIComponent', () => {
        expect(match({id: 'a/b'})).toBe('/matches/a%2Fb')
    })

    it('kitchenSink() without optional group', () => {
        expect(kitchenSink({foo: 'a', baz: 'b', splat: ['x', 'y']})).toBe('/hello/a/bar/b/x/y/xxx')
    })

    it('kitchenSink() with optional group', () => {
        expect(kitchenSink({foo: 'a', baz: 'b', splat: ['x', 'y'], optional: 'opt', two: 'two'})).toBe(
            '/hello/a/bar/b/x/y/xxx/opt/lol/two',
        )
    })

    it('kitchenSink() requires all-or-none optional group', () => {
        expect(() => kitchenSink({foo: 'a', baz: 'b', splat: ['x', 'y'], optional: 'opt'} as any)).toThrow(
            'Group requires all-or-none: "optional", "two"',
        )
    })
})
