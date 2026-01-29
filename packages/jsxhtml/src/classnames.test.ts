import {expect, test} from 'bun:test'
import {classCat} from './classnames'

test('supports strings', () => {
    expect(classCat('foo', true && 'bar', 'baz')).toBe('foo bar baz')
})

test('supports objects', () => {
    const isTrue = () => true
    expect(classCat({foo: true, bar: false, baz: isTrue()})).toBe('foo baz')
    expect(classCat({foo: true}, {bar: false}, null, {'--foobar': 'hello'})).toBe('foo --foobar')
})

test('supports arrays', () => {
    expect(classCat(['foo', 0, false, 'bar'])).toBe('foo 0 bar')
    expect(classCat(['foo'], ['', 0, false, 'bar'], [['baz', [['hello'], 'there']]])).toBe('foo 0 bar baz hello there')
})

test('supports nested inputs', () => {
    expect(classCat('foo', [1 && 'bar', {baz: false, bat: null}, ['hello', ['world']]], 'cya')).toBe('foo bar hello world cya')
})

test('matches classnames-style usage', () => {
    expect(classCat('foo', 'bar')).toBe('foo bar')
    expect(classCat('foo', {bar: true})).toBe('foo bar')
    expect(classCat({'foo-bar': true})).toBe('foo-bar')
    expect(classCat({'foo-bar': false})).toBe('')
    expect(classCat({foo: true}, {bar: true})).toBe('foo bar')
    expect(classCat({foo: true, bar: true})).toBe('foo bar')
    expect(classCat('foo', {bar: true, duck: false}, 'baz', {quux: true})).toBe('foo bar baz quux')
    expect(classCat(null, false, 'bar', undefined, 0, 1, {baz: null}, '')).toBe('bar 0 1')
})

test('matches classcat-style usage', () => {
    expect(classCat('elf')).toBe('elf')
    expect(classCat(['elf', 'orc', 'gnome'])).toBe('elf orc gnome')
    expect(classCat({
        elf: false,
        orc: null,
        gnome: undefined,
    })).toBe('')
    expect(classCat({
        elf: true,
        orc: false,
        gnome: true,
    })).toBe('elf gnome')
    expect(classCat([
        {
            elf: true,
            orc: false,
        },
        'gnome',
    ])).toBe('elf gnome')
})
