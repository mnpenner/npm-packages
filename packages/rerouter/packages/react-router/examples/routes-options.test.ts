#!/usr/bin/env -S bun test
import {describe, expect, it} from 'bun:test'
import {kitchenSink, match} from './routes-options.gen'

describe('routes-options.gen', () => {
    it('match() uses encodeURI', () => {
        expect(match({id: 'a/b'})).toBe('/matches/a/b')
    })

    it('kitchenSink() uses encodeURI and wildcard delimiter', () => {
        expect(kitchenSink({foo: 'a/b', baz: 'c', splat: ['x', 'y']})).toBe('/hello/a/b/bar/c/x,y/xxx')
    })
})

