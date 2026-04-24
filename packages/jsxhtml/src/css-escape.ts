/*! Adapted from https://github.com/mathiasbynens/CSS.escape/blob/4b25c283eaf4dd443f44a7096463e973d56dd1b2/css.escape.js */

/**
 * Escapes a string for use as a CSS identifier.
 *
 * This function is an implementation of the CSS Object Model's `CSS.escape()`
 * method. It can be used to safely escape strings for use in CSS selectors.
 *
 * @see https://drafts.csswg.org/cssom/#the-css.escape()-method
 *
 * @param value The string to be escaped. In the original spec, this is a `DOMString`.
 * @returns The escaped string.
 *
 * @example
 * ```ts
 * import cssEscape from './css-escape';
 *
 * const id = 'foo.bar:baz';
 * const escapedId = cssEscape(id); // 'foo\\.bar\\:baz'
 * const selector = `#${escapedId}`; // '#foo\\.bar\\:baz'
 *
 * // This selector can now be used with document.querySelector
 * // const element = document.querySelector(selector);
 * ```
 */
export default function cssEscape(value: string): string {
    const string = String(value)
    const length = string.length
    let index = -1
    let codeUnit: number
    let result = ''
    const firstCodeUnit = string.charCodeAt(0)

    // If the character is the first character and is a `-` (U+002D), and
    // there is no second character, return the escaped dash.
    if(length === 1 && firstCodeUnit === 0x002D) {
        return '\\' + string
    }

    while(++index < length) {
        codeUnit = string.charCodeAt(index)
        // Note: there’s no need to special-case astral symbols, surrogate
        // pairs, or lone surrogates.

        // If the character is NULL (U+0000), then the REPLACEMENT CHARACTER (U+FFFD).
        if(codeUnit === 0x0000) {
            result += '\uFFFD'
            continue
        }

        if(
            // If the character is in the range [\1-\1F] (U+0001 to U+001F) or is U+007F...
            (codeUnit >= 0x0001 && codeUnit <= 0x001F) || codeUnit === 0x007F ||
            // If the character is the first character and is in the range [0-9] (U+0030 to U+0039)...
            (index === 0 && codeUnit >= 0x0030 && codeUnit <= 0x0039) ||
            // If the character is the second character and is in the range [0-9]
            // (U+0030 to U+0039) and the first character is a `-` (U+002D)...
            (index === 1 && codeUnit >= 0x0030 && codeUnit <= 0x0039 && firstCodeUnit === 0x002D)
        ) {
            // ...escape as a code point.
            // https://drafts.csswg.org/cssom/#escape-a-character-as-code-point
            result += '\\' + codeUnit.toString(16) + ' '
            continue
        }

        if(
            // If the character is not handled by one of the above rules and is
            // greater than or equal to U+0080, is `-` (U+002D) or `_` (U+005F), or
            // is in one of the ranges [0-9], [A-Z], or [a-z]...
            codeUnit >= 0x0080 ||
            codeUnit === 0x002D || // -
            codeUnit === 0x005F || // _
            (codeUnit >= 0x0030 && codeUnit <= 0x0039) || // 0-9
            (codeUnit >= 0x0041 && codeUnit <= 0x005A) || // A-Z
            (codeUnit >= 0x0061 && codeUnit <= 0x007A)    // a-z
        ) {
            // ...the character itself.
            result += string.charAt(index)
            continue
        }

        // Otherwise, the escaped character.
        // https://drafts.csswg.org/cssom/#escape-a-character
        result += '\\' + string.charAt(index)
    }
    return result
}

