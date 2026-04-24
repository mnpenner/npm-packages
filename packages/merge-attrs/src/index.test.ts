import mergeAttrs from './index'
import {describe, expect, it, jest} from 'bun:test'

describe(mergeAttrs.name, () => {
    it('merges basic attributes', () => {
        expect(mergeAttrs({foo: 'bar'}, {baz: 'quux'})).toEqual({foo: 'bar', baz: 'quux'})
    })

    it('merges class names', () => {
        expect(
            mergeAttrs(
                {className: 'foo'},
                {className: 'bar'}
            )
        ).toEqual(
            {className: 'foo bar'}
        )

        expect(
            mergeAttrs(
                {className: 'foo'},
                {className: ['bar', 'baz', null, false, undefined, 'quux']}
            )
        ).toEqual(
            {className: 'foo bar baz quux'}
        )

        expect(
            mergeAttrs({className: {foo: true, bar: false, baz: undefined}})
        ).toEqual(
            {className: 'foo'}
        )

        expect(
            mergeAttrs({className: undefined}, {className: ['foo', 'bar']})
        ).toEqual(
            {className: 'foo bar'}
        )
    })

    it('merges styles', () => {
        expect(
            mergeAttrs(
                {
                    style: {
                        color: 'red',
                        fontSize: 200,
                    }
                },
                {
                    style: {
                        color: 'blue',
                        fontFamily: 'verdana',
                    },
                }
            )
        ).toEqual(
            {
                style: {
                    color: 'blue',
                    fontFamily: 'verdana',
                    fontSize: 200,
                },
            }
        )

        expect(
            mergeAttrs(
                {
                    type: 'text',
                },
                {
                    style: {
                        color: 'blue',
                        fontFamily: 'verdana',
                    },
                }
            )
        ).toEqual(
            {
                style: {
                    color: 'blue',
                    fontFamily: 'verdana',
                },
                type: 'text',
            }
        )

        expect(
            mergeAttrs(
                {
                    style: undefined
                },
                {
                    style: {
                        color: 'blue',
                        fontFamily: 'verdana',
                    },
                }
            )
        ).toEqual(
            {
                style: {
                    color: 'blue',
                    fontFamily: 'verdana',
                },
            }
        )
    })

    it(`doesn't mutate styles`, () => {
        let style = {foo: 'bar'}
        let result = mergeAttrs({style}, {style: {baz: 99}})
        expect(style).toEqual({foo: 'bar'})
    })

    it('merges event handlers', () => {
        const noop = () => {
        }
        let result1 = mergeAttrs({onClick: noop}, {onClick: undefined})
        expect(result1.onClick).toBe(noop)

        const val = Symbol('mock')
        const handler1 = jest.fn(() => val)
        const handler2 = jest.fn()
        let result2 = mergeAttrs({onClick: handler1}, {onClick: handler2})
        const ev = {}
        result2.onClick(ev)
        expect(handler1).toBeCalledWith(ev)
        expect(handler2).toBeCalledWith(ev, val)
    })

    it('merges refs', () => {
        const val = Symbol('mock')
        const handler1 = jest.fn(() => val)
        const handler2 = jest.fn()
        let result2 = mergeAttrs({ref: handler1}, {ref: handler2})
        const node = {}
        result2.ref(node)
        expect(handler1).toBeCalledWith(node)
        expect(handler2).toBeCalledWith(node, val)
    })

    it('allows deleting and undefining props', () => {
        const result = mergeAttrs({foo: 'bar', baz: 'quux', corge: 'grault'}, {
            foo: mergeAttrs.DELETE,
            baz: mergeAttrs.UNDEFINED
        })
        expect(result).toEqual({baz: undefined, corge: 'grault'})
    })

    it(`doesn't copy undefined props`, () => {
        const result = mergeAttrs({foo: 'bar'}, {foo: undefined, baz: undefined})
        expect(result).toEqual({foo: 'bar'})
    })

    it(`deletes undefined props from left-most object`, () => {
        const result = mergeAttrs({foo: 'bar', bar: undefined})
        expect(result).toEqual({foo: 'bar'}) // fixme: https://github.com/facebook/jest/issues/711
    })
})
