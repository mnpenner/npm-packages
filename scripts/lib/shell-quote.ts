// Modified from https://github.com/ljharb/shell-quote/blob/3344a047dd1e95f71c4ca27522cbfd05c56277e0/quote.js

/**
 * Quotes one argument for a POSIX-style shell command string.
 *
 * This function is intended for shell syntax that treats single quotes as
 * quoting characters, such as `sh`, `bash`, and most PowerShell native command
 * invocations. It is not `cmd.exe` quoting; `cmd.exe` treats single quotes as
 * literal characters and needs different escaping rules.
 *
 * NUL bytes cannot be represented in shell command strings or process argv, so
 * this function throws instead of returning a lossy or misleading command
 * fragment.
 *
 * @example
 * ```ts
 * shellQuote('c d')
 * // "'c d'"
 *
 * shellQuote('C:\\projects\\app\\index.js')
 * // "'C:\\projects\\app\\index.js'"
 *
 * shellQuote('&&')
 * // "\\&\\&"
 * ```
 *
 * @param s - The argument to quote.
 * @returns The POSIX-shell-safe representation of `s`.
 * @throws {TypeError} If `s` contains a NUL byte.
 */
export function shellQuote(s: string): string {
    if (s.includes('\0')) {
        throw new TypeError('shell arguments cannot contain NUL bytes')
    }
    if (s === '') {
        return "''"
    }
    if (/["\s\\]/.test(s) && !/'/.test(s)) {
        return "'" + s.replace(/(')/g, '\\$1') + "'"
    }
    if (/["'\s]/.test(s)) {
        return '"' + s.replace(/(["\\$`])/g, '\\$1') + '"'
    }
    return s.replace(/([A-Za-z]:)?([#!"$&'()*,:;<=>?@[\\\]^`{|}])/g, '$1\\$2')
}

/**
 * Quotes a list of arguments for a POSIX-style shell command string.
 *
 * Each item is quoted with [`shellQuote`]{@link shellQuote} and then joined with
 * spaces. The returned string is suitable for POSIX-style shell syntax, not
 * `cmd.exe` syntax.
 *
 * Shell operator tokens such as `|`, `&&`, and `;` can be passed as normal
 * strings. They are escaped by [`shellQuote`]{@link shellQuote}, so they are
 * passed literally instead of being interpreted as shell control syntax.
 *
 * @example
 * ```ts
 * shellQuoteArgs(['bun', 'test', 'c d'])
 * // "bun test 'c d'"
 *
 * shellQuoteArgs(['a', '&&', 'b'])
 * // "a \\&\\& b"
 * ```
 *
 * @param xs - The arguments to quote.
 * @returns A POSIX-shell-safe command argument string.
 * @throws {TypeError} If any argument contains a NUL byte.
 */
export function shellQuoteArgs(xs: string[]): string {
    return xs.map(shellQuote).join(' ')
}
