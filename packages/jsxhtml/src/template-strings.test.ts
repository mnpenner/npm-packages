import {expect, it, test} from 'bun:test'
import {js} from './template-strings'

test('js', () => {
    expect(js`hello`).toEqual('hello')
    expect(js`hello ${"world"}`).toEqual('hello "world"')
    expect(js`hello ${42}`).toEqual('hello 42')
    expect(js`hello ${"</script>"}`).toEqual('hello "<\\/script>"')
})
