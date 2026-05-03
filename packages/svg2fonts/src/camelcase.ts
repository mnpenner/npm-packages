/*!
 * Portions derived from lodash:
 * https://github.com/Tcdian/Lodash/blob/d83146916369b3111341c883008babc29cd85057/source/string/camelCase.ts#L5
 *
 * MIT License
 * Copyright (c) 2020 Tcdian
 */

export function camelCase(string = ''): string {
    return words(string)
        .map((word, index) => (index === 0 ? toLower(word) : upperFirst(toLower(word))))
        .join('')
}

const wordPattern = new RegExp(
    ['[A-Z][a-z]+', '[A-Z]+(?=[A-Z][a-z])', '[A-Z]+', '[a-z]+', '[0-9]+'].join('|'),
    'g',
)

function words(string = '', pattern?: RegExp | string): string[] {
    if (pattern === undefined) {
        return string.match(wordPattern) || []
    }
    return string.match(pattern) || []
}

function upperFirst(string: string): string {
    return string.slice(0, 1).toUpperCase() + string.slice(1)
}

function toLower(string: string): string {
    return string.toLowerCase()
}
