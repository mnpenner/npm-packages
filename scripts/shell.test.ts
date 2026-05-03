#!/usr/bin/env -S bun test
import { expect, test } from 'bun:test'
import { shellQuoteArgs } from './shell'

test('quote', () => {
    expect(shellQuoteArgs(['a', 'b', 'c d'])).toBe("a b 'c d'")
    expect(shellQuoteArgs(['a', 'b', 'it\'s a "neat thing"'])).toBe('a b "it\'s a \\"neat thing\\""')
    expect(shellQuoteArgs(['$', '`', "'"])).toBe('\\$ \\` "\'"')
    expect(shellQuoteArgs([])).toBe('')
    expect(shellQuoteArgs(['a\nb'])).toBe("'a\nb'")
    expect(shellQuoteArgs([' #(){}*|][!'])).toBe("' #(){}*|][!'")
    expect(shellQuoteArgs(["'#(){}*|][!"])).toBe('"\'#(){}*|][\\!"')
    expect(shellQuoteArgs(['X#(){}*|][!'])).toBe('X\\#\\(\\)\\{\\}\\*\\|\\]\\[\\!')
    expect(shellQuoteArgs(['a\n#\nb'])).toBe("'a\n#\nb'")
    expect(shellQuoteArgs(['><;{}'])).toBe('\\>\\<\\;\\{\\}')
    expect(shellQuoteArgs(['a', 1, true, false] as never)).toBe('a 1 true false')
    expect(shellQuoteArgs(['a', 1, null, undefined] as never)).toBe('a 1 null undefined')
    expect(shellQuoteArgs(['a\\x'])).toBe("'a\\x'")
    expect(shellQuoteArgs(['a"b'])).toBe("'a\"b'")
    expect(shellQuoteArgs(['"a"b"'])).toBe('\'"a"b"\'')
    expect(shellQuoteArgs(['a\\"b'])).toBe("'a\\\"b'")
    expect(shellQuoteArgs(['a\\b'])).toBe("'a\\b'")
})

test('quote ops', () => {
    expect(shellQuoteArgs(['a', { op: '|' }, 'b'])).toBe('a \\| b')
    expect(shellQuoteArgs(['a', { op: '&&' }, 'b', { op: ';' }, 'c'])).toBe('a \\&\\& b \\; c')
})

test.skip('quote windows paths', () => {
    const path = 'C:\\projects\\node-shell-quote\\index.js'

    expect(shellQuoteArgs([path, 'b', 'c d'])).toBe("C:\\projects\\node-shell-quote\\index.js b 'c d'")
})

test("chars for windows paths don't break out", () => {
    const x = '`:\\a\\b'
    expect(shellQuoteArgs([x])).toBe("'`:\\a\\b'")
})

test('empty strings', () => {
    expect(shellQuoteArgs(['-x', '', 'y'])).toBe("-x '' y")
})
