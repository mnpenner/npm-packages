import {expect, test} from 'bun:test'
import {css, js} from './template-strings'

expect.extend({
    toStrEq(received: unknown, expected: string) {
        if(typeof received?.toString !== 'function') {
            return {
                pass: false,
                message: () => `expected a frag but got ${this.utils.printReceived(typeof received)}`,
            }
        }

        const normalizedReceived = received.toString().trim().replace(/\s+/g, ' ')
        const normalizedExpected = expected.toString().trim().replace(/\s+/g, ' ')

        const pass = normalizedReceived === normalizedExpected
        return {
            pass,
            message: () => `expected string ${pass ? 'not ' : ''}to be whitespace-normalized equal to\n${this.utils.printExpected(expected)}\nreceived:\n${this.utils.printReceived(received.toString())}`
        }
    },
})

declare module 'bun:test' {
    interface Matchers<T = unknown> {
        toStrEq(expected: string): void;
    }
}

test('js', () => {
    expect(js`hello`).toStrEq('hello')
    expect(js`hello ${"world"}`).toStrEq('hello "world"')
    expect(js`hello ${42}`).toStrEq('hello 42')
    expect(js`hello ${"</script>"}`).toStrEq('hello "<\\/script>"')
    expect(js`const obj=${{foo: 'bar'}};\nconst arr=${['baz', null, Math.PI]};`).toStrEq("const obj={foo:\"bar\"};\nconst arr=[\"baz\",null,Math.PI];")
})

test('css', () => {
    // https://developer.mozilla.org/en-US/docs/Web/API/CSS/escape_static#basic_results
    expect(css`[data-foo=${'.foo#bar'}]`).toStrEq("[data-foo=\\.foo\\#bar]")
    expect(css`.${'()[]{}'}`).toStrEq(".\\(\\)\\[\\]\\{\\}")
    expect(css`${'--a'}-prop`).toStrEq("--a-prop")
    expect(css`${0}`).toStrEq("\\30 ")
    expect(css`${'\0'}`).toStrEq("\ufffd")
})

