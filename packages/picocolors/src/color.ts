/*!
 * Portions derived from picocolors:
 * https://github.com/alexeyraspopov/picocolors/blob/0e7c4af2de299dd7bc5916f2bddd151fa2f66740/picocolors.js
 *
 * Copyright (c) 2021-2024 Oleksii Raspopov,
 * Kostiantyn Denysov, Anton Verinov
 *
 * Permission to use, copy, modify, and/or distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
 * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
 * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
 * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
 * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 */

/**
 * Formats a value with ANSI escape sequences.
 *
 * @param input - The value to convert to a string and format.
 * @returns The formatted string.
 *
 * @example
 * ```ts
 * const red: ColorFormatter = (input) => `\x1b[31m${input}\x1b[39m`
 * red('error')
 * ```
 */
export type ColorFormatter = (input: unknown) => string

/**
 * Creates a formatter for a 24-bit RGB ANSI color.
 *
 * @param red - The red channel as an integer from 0 to 255.
 * @param green - The green channel as an integer from 0 to 255.
 * @param blue - The blue channel as an integer from 0 to 255.
 * @returns A formatter for the requested RGB color.
 *
 * @example
 * ```ts
 * const colors = createColors()
 * const orange = colors.rgb(255, 128, 0)
 * orange('warning')
 * ```
 */
export type RgbColorFactory = (red: number, green: number, blue: number) => ColorFormatter

/**
 * Creates a formatter for a 24-bit hexadecimal ANSI color.
 *
 * @param color - The color as `#rgb`, `rgb`, `#rrggbb`, or `rrggbb`.
 * @returns A formatter for the requested hexadecimal color.
 *
 * @example
 * ```ts
 * const colors = createColors()
 * const violet = colors.hex('#7c3aed')
 * violet('accent')
 * ```
 */
export type HexColorFactory = (color: string) => ColorFormatter

type FormatterFactory = (open: string, close: string, replace?: string) => ColorFormatter
type RgbFormatterFactory = (red: number, green: number, blue: number) => ColorFormatter

const processInfo =
    typeof process === 'undefined' ? undefined : (process as Partial<NodeJS.Process>)
const env = processInfo?.env ?? {}

/**
 * Whether ANSI colors are supported in the current process.
 *
 * @example
 * ```ts
 * import createColors from '@mpen/picocolors'
 *
 * const colors = createColors()
 * if (colors.isColorSupported) {
 *     console.log('colors are enabled')
 * }
 * ```
 */
const isColorSupported =
    !env.NO_COLOR &&
    (Boolean(env.FORCE_COLOR) ||
        processInfo?.platform === 'win32' ||
        (Boolean(processInfo?.stdout?.isTTY) && env.TERM !== 'dumb') ||
        Boolean(env.CI))

const replaceClose = (string: string, close: string, replace: string, index: number) => {
    let result = ''
    let cursor = 0

    do {
        result += string.substring(cursor, index) + replace
        cursor = index + close.length
        index = string.indexOf(close, cursor)
    } while (index >= 0)

    return result + string.substring(cursor)
}

const formatter: FormatterFactory =
    (open, close, replace = open) =>
    (input) => {
        const string = String(input)
        const index = string.indexOf(close, open.length)

        return index >= 0
            ? open + replaceClose(string, close, replace, index) + close
            : open + string + close
    }

const assertRgbChannel = (channel: number, name: string) => {
    if (!Number.isInteger(channel) || channel < 0 || channel > 255) {
        throw new RangeError(`${name} must be an integer from 0 to 255`)
    }
}

const rgbFormatter =
    (f: FormatterFactory, prefix: 38 | 48, close: string): RgbFormatterFactory =>
    (red, green, blue) => {
        assertRgbChannel(red, 'red')
        assertRgbChannel(green, 'green')
        assertRgbChannel(blue, 'blue')

        return f(`\x1b[${prefix};2;${red};${green};${blue}m`, close)
    }

const parseHexColor = (color: string): [red: number, green: number, blue: number] => {
    const match = /^#?(?<hex>[0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color)
    const hex = match?.groups?.hex

    if (!hex) {
        throw new TypeError('color must be a 3- or 6-digit hex color')
    }

    if (hex.length === 3) {
        return [
            Number.parseInt(`${hex[0]}${hex[0]}`, 16),
            Number.parseInt(`${hex[1]}${hex[1]}`, 16),
            Number.parseInt(`${hex[2]}${hex[2]}`, 16),
        ]
    }

    return [
        Number.parseInt(hex.slice(0, 2), 16),
        Number.parseInt(hex.slice(2, 4), 16),
        Number.parseInt(hex.slice(4, 6), 16),
    ]
}

/**
 * Creates a color formatter set.
 *
 * @param enabled - Whether the returned formatters should emit ANSI escape sequences.
 * Defaults to detected color support for the current process.
 * @returns A color formatter set.
 *
 * @example
 * ```ts
 * import createColors from '@mpen/picocolors'
 *
 * const pc = createColors(true)
 * pc.bold(pc.red('error'))
 * ```
 */
export default function createColors(enabled = isColorSupported) {
    const f: FormatterFactory = enabled ? formatter : () => String
    const rgb = rgbFormatter(f, 38, '\x1b[39m')
    const bgRgb = rgbFormatter(f, 48, '\x1b[49m')

    return {
        isColorSupported: enabled,
        reset: f('\x1b[0m', '\x1b[0m'),
        bold: f('\x1b[1m', '\x1b[22m', '\x1b[22m\x1b[1m'),
        dim: f('\x1b[2m', '\x1b[22m', '\x1b[22m\x1b[2m'),
        italic: f('\x1b[3m', '\x1b[23m'),
        underline: f('\x1b[4m', '\x1b[24m'),
        inverse: f('\x1b[7m', '\x1b[27m'),
        hidden: f('\x1b[8m', '\x1b[28m'),
        strikethrough: f('\x1b[9m', '\x1b[29m'),

        black: f('\x1b[30m', '\x1b[39m'),
        red: f('\x1b[31m', '\x1b[39m'),
        green: f('\x1b[32m', '\x1b[39m'),
        yellow: f('\x1b[33m', '\x1b[39m'),
        blue: f('\x1b[34m', '\x1b[39m'),
        magenta: f('\x1b[35m', '\x1b[39m'),
        cyan: f('\x1b[36m', '\x1b[39m'),
        white: f('\x1b[37m', '\x1b[39m'),
        gray: f('\x1b[90m', '\x1b[39m'),

        bgBlack: f('\x1b[40m', '\x1b[49m'),
        bgRed: f('\x1b[41m', '\x1b[49m'),
        bgGreen: f('\x1b[42m', '\x1b[49m'),
        bgYellow: f('\x1b[43m', '\x1b[49m'),
        bgBlue: f('\x1b[44m', '\x1b[49m'),
        bgMagenta: f('\x1b[45m', '\x1b[49m'),
        bgCyan: f('\x1b[46m', '\x1b[49m'),
        bgWhite: f('\x1b[47m', '\x1b[49m'),

        blackBright: f('\x1b[90m', '\x1b[39m'),
        redBright: f('\x1b[91m', '\x1b[39m'),
        greenBright: f('\x1b[92m', '\x1b[39m'),
        yellowBright: f('\x1b[93m', '\x1b[39m'),
        blueBright: f('\x1b[94m', '\x1b[39m'),
        magentaBright: f('\x1b[95m', '\x1b[39m'),
        cyanBright: f('\x1b[96m', '\x1b[39m'),
        whiteBright: f('\x1b[97m', '\x1b[39m'),

        bgBlackBright: f('\x1b[100m', '\x1b[49m'),
        bgRedBright: f('\x1b[101m', '\x1b[49m'),
        bgGreenBright: f('\x1b[102m', '\x1b[49m'),
        bgYellowBright: f('\x1b[103m', '\x1b[49m'),
        bgBlueBright: f('\x1b[104m', '\x1b[49m'),
        bgMagentaBright: f('\x1b[105m', '\x1b[49m'),
        bgCyanBright: f('\x1b[106m', '\x1b[49m'),
        bgWhiteBright: f('\x1b[107m', '\x1b[49m'),

        rgb,
        bgRgb,
        hex: (color: string) => rgb(...parseHexColor(color)),
        bgHex: (color: string) => bgRgb(...parseHexColor(color)),
    }
}

export { createColors }
export type Colors = ReturnType<typeof createColors>
