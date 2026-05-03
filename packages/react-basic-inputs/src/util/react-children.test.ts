import { describe, expect, it } from 'bun:test'
import { iterateChildren } from './react-children.ts'
import { createElement } from 'react'

describe('iterateChildren', () => {
    it('handles strings without infinite recursion', () => {
        const iterator = iterateChildren('hello' as any)
        expect(Array.from(iterator)).toEqual([])
    })

    it('iterates deep children', () => {
        const el = createElement(
            'div',
            {},
            createElement('span', {}, 'a'),
            createElement('span', {}, 'b'),
        )
        const types = Array.from(iterateChildren(el)).map((c) => c.type)
        expect(types).toEqual(['div', 'span', 'span'])
    })

    it('handles arrays', () => {
        const children = [createElement('div', { key: 1 }), createElement('div', { key: 2 })]
        const types = Array.from(iterateChildren(children)).map((c) => c.type)
        expect(types).toEqual(['div', 'div'])
    })
})
