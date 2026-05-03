#!/usr/bin/env -S bun test
import { expect, test } from 'bun:test'
import { shellQuote, shellQuoteArgs } from './shell-quote'

test('quote', () => {
    expect(shellQuoteArgs(['a', 'b', 'c d'])).toBe("a b 'c d'")
    expect(shellQuoteArgs(['a', 'b', 'it\'s a "neat thing"'])).toBe(
        'a b "it\'s a \\"neat thing\\""',
    )
    expect(shellQuoteArgs(['$', '`', "'"])).toBe('\\$ \\` "\'"')
    expect(shellQuoteArgs([])).toBe('')
    expect(shellQuoteArgs(['a\nb'])).toBe("'a\nb'")
    expect(shellQuoteArgs([' #(){}*|][!'])).toBe("' #(){}*|][!'")
    expect(shellQuoteArgs(["'#(){}*|][!"])).toBe('"\'#(){}*|][!"')
    expect(shellQuoteArgs(['X#(){}*|][!'])).toBe('X\\#\\(\\)\\{\\}\\*\\|\\]\\[\\!')
    expect(shellQuoteArgs(['a\n#\nb'])).toBe("'a\n#\nb'")
    expect(shellQuoteArgs(['><;{}'])).toBe('\\>\\<\\;\\{\\}')
    expect(shellQuoteArgs(['a\\x'])).toBe("'a\\x'")
    expect(shellQuoteArgs(['a"b'])).toBe("'a\"b'")
    expect(shellQuoteArgs(['"a"b"'])).toBe('\'"a"b"\'')
    expect(shellQuoteArgs(['a\\"b'])).toBe("'a\\\"b'")
    expect(shellQuoteArgs(['a\\b'])).toBe("'a\\b'")
})

test('quote ops', () => {
    expect(shellQuoteArgs(['a', '|', 'b'])).toBe('a \\| b')
    expect(shellQuoteArgs(['a', '&&', 'b', ';', 'c'])).toBe('a \\&\\& b \\; c')
})

test('quote windows paths', () => {
    const path = 'C:\\projects\\node-shell-quote\\index.js'

    expect(shellQuoteArgs([path, 'b', 'c d'])).toBe(
        "'C:\\projects\\node-shell-quote\\index.js' b 'c d'",
    )
})

test("chars for windows paths don't break out", () => {
    const x = '`:\\a\\b'
    expect(shellQuoteArgs([x])).toBe("'`:\\a\\b'")
})

test('empty strings', () => {
    expect(shellQuoteArgs(['-x', '', 'y'])).toBe("-x '' y")
})

test('nul bytes', () => {
    expect(() => shellQuote('a\0b')).toThrow('shell arguments cannot contain NUL bytes')
    expect(() => shellQuoteArgs(['a', 'b\0c'])).toThrow('shell arguments cannot contain NUL bytes')
})
