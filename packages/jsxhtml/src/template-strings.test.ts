import {expect, it, test} from 'bun:test'
import {js, JsFrag} from './template-strings'

expect.extend({
    toEqJs(received: unknown, expected: string) {
        if(!(received instanceof JsFrag)) {
            return {
                pass: false,
                message: () => `expected a JsFrag but got ${this.utils.printReceived(typeof received)}`,
            }
        }

        const normalizedReceived = received.toString().trim().replace(/\s+/g, ' ')
        const normalizedExpected = received.toString().trim().replace(/\s+/g, ' ')

        const pass = normalizedReceived === normalizedExpected
        return {
            pass,
            message: () => `expected string ${pass ? 'not ' : ''}to be whitespace-normalized equal to\n${this.utils.printReceived(expected)}\n${this.utils.printExpected(received.toString())}`
        }
    },
})

declare module 'bun:test' {
    interface Matchers<T = unknown> {
        toEqJs(expected: string): void;
    }
}

test('js', () => {
    expect(js`hello`).toEqJs('hello')
    expect(js`hello ${"world"}`).toEqJs('hello "world"')
    expect(js`hello ${42}`).toEqJs('hello 42')
    expect(js`hello ${"</script>"}`).toEqJs('hello "<\\/script>"')
    expect(js`const obj=${{foo: 'bar'}};\nconst arr=${['baz', null, Math.PI]};`).toEqJs("const obj={foo:\"bar\"};\nconst arr=[\"baz\",null,Math.PI];")
})
