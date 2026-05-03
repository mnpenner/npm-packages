// Modified from https://github.com/ljharb/shell-quote/blob/3344a047dd1e95f71c4ca27522cbfd05c56277e0/quote.js

interface Op {
    op: string
}

/**
 * Quotes one argument for a POSIX-style shell command string.
 *
 * This function is intended for shell syntax that treats single quotes as
 * quoting characters, such as `sh`, `bash`, and most PowerShell native command
 * invocations. It is not `cmd.exe` quoting; `cmd.exe` treats single quotes as
 * literal characters and needs different escaping rules.
 *
 * Passing an object with an `op` property marks a shell operator token such as
 * `|`, `&&`, or `;`. Operators are escaped character-by-character so they are
 * passed literally instead of being interpreted as shell control syntax.
 *
 * @example
 * ```ts
 * shellQuote('c d')
 * // "'c d'"
 *
 * shellQuote('C:\\projects\\app\\index.js')
 * // "'C:\\projects\\app\\index.js'"
 *
 * shellQuote({ op: '&&' })
 * // "\\&\\&"
 * ```
 *
 * @param s - The argument or escaped operator marker to quote.
 * @returns The POSIX-shell-safe representation of `s`.
 */
export function shellQuote(s: string|Op): string {
    if (s === '') {
        return "''"
    }
    if (s && typeof s === 'object') {
        return s.op.replace(/(.)/g, '\\$1')
    }
    if (/["\s\\]/.test(s) && !/'/.test(s)) {
        return "'" + s.replace(/(')/g, '\\$1') + "'"
    }
    if (/["'\s]/.test(s)) {
        return '"' + s.replace(/(["\\$`!])/g, '\\$1') + '"'
    }
    return String(s).replace(/([A-Za-z]:)?([#!"$&'()*,:;<=>?@[\\\]^`{|}])/g, '$1\\$2')
}

/**
 * Quotes a list of arguments for a POSIX-style shell command string.
 *
 * Each item is quoted with [`shellQuote`]{@link shellQuote} and then joined with
 * spaces. The returned string is suitable for POSIX-style shell syntax, not
 * `cmd.exe` syntax.
 *
 * Objects with an `op` property represent shell operator tokens that should be
 * preserved as literal text. For example, `{ op: '|' }` becomes `\|`, so the
 * pipe character is passed as an argument instead of connecting two commands.
 *
 * @example
 * ```ts
 * shellQuoteArgs(['bun', 'test', 'c d'])
 * // "bun test 'c d'"
 *
 * shellQuoteArgs(['a', { op: '&&' }, 'b'])
 * // "a \\&\\& b"
 * ```
 *
 * @param xs - The arguments or escaped operator markers to quote.
 * @returns A POSIX-shell-safe command argument string.
 */
export function shellQuoteArgs(xs: (string|Op)[]): string {
    return xs.map(shellQuote).join(' ')
}
