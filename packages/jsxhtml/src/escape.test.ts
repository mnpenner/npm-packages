#!/usr/bin/env -S bun test
import {describe, expect, it} from 'bun:test'
import {
    attrKvPair,
    attrName,
    attrValue,
    attrs,
    escapeScript,
    escapeStyle,
    htmlComment,
    htmlContent,
    tagName,
} from './escape'

describe(tagName.name, () => {
    it('escapes non-alphanumeric characters', () => {
        expect(tagName('my<tag')).toBe('my&lt;tag')
        expect(tagName('x-y')).toBe('x&#x2d;y')
    })
})

describe(attrName.name, () => {
    it('escapes forbidden attribute-name characters', () => {
        expect(attrName('data "value"')).toBe('data&#x20;&quot;value&quot;')
        expect(attrName('a>b')).toBe('a&gt;b')
    })
})

describe(attrValue.name, () => {
    it('quotes and escapes string values', () => {
        expect(attrValue('a"b')).toBe('\'a"b\'')
    })

    it('wraps function values with an event call', () => {
        function handler() {
            return 'ok'
        }
        const out = attrValue(handler)
        expect(out.startsWith('"(') || out.startsWith("'(")).toBe(true)
        expect(out).toContain('call(this,event)')
        expect(out.endsWith('"') || out.endsWith("'")).toBe(true)
    })
})

describe(attrKvPair.name, () => {
    it('handles boolean and nullish values', () => {
        expect(attrKvPair('disabled', true)).toBe('disabled')
        expect(attrKvPair('hidden', false)).toBeNull()
        expect(attrKvPair('title', null)).toBeNull()
    })

    it('stringifies data- attributes when needed', () => {
        expect(attrKvPair('data-info', {a: 1})).toBe('data-info=\'{"a":1}\'')
    })

    it('normalizes class and style values', () => {
        expect(attrKvPair('class', ['a', false, 'b'])).toBe('class="a b"')
        expect(attrKvPair('style', {backgroundColor: 'red', width: 2})).toBe('style=background-color:red;width:2px;')
    })
})

describe(attrs.name, () => {
    it('returns an empty string for nullish inputs', () => {
        expect(attrs(null as any)).toBe('')
    })

    it('serializes object attributes with leading spaces', () => {
        expect(attrs({id: 'a', disabled: true, hidden: false})).toBe(' id=a disabled')
    })

    it('accepts array entries as input', () => {
        expect(attrs([['id', 'a'], ['title', 'hello']])).toBe(' id=a title=hello')
    })
})

describe(htmlContent.name, () => {
    it('escapes tag delimiters and existing entities', () => {
        expect(htmlContent('5 < 6 &amp; 7')).toBe('5 &lt; 6 &amp;amp; 7')
    })

    it('preserves raw ampersands', () => {
        expect(htmlContent('x & y')).toBe('x & y')
    })
})

describe(htmlComment.name, () => {
    it('escapes comment terminators', () => {
        expect(htmlComment('a --> b')).toBe('a --&gt; b')
    })
})

describe(escapeScript.name, () => {
    it('escapes closing script tags', () => {
        expect(escapeScript('<script></script>')).toBe('<script><\\/script>')
        expect(escapeScript('</SCRIPT>')).toBe('<\\/SCRIPT>')
    })
})

describe(escapeStyle.name, () => {
    it('escapes closing style tags', () => {
        expect(escapeStyle('<style></style>')).toBe('<style><\\/style>')
        expect(escapeStyle('</STYLE>')).toBe('<\\/STYLE>')
    })
})
