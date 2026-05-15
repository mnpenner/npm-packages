export type FormattableNumber = Parameters<Intl.NumberFormat['format']>[0]

const FULL_WIDE_FORMAT = new Intl.NumberFormat('en-US', {
    useGrouping: false,
    maximumFractionDigits: 20,
})

const DECIMAL_STRING = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/
const MAX_SAFE_INTEGER_STRING = String(Number.MAX_SAFE_INTEGER)
const MIN_SAFE_INTEGER_STRING = String(Number.MIN_SAFE_INTEGER)

/**
 * Formats a number with full decimal places.
 *
 * e.g. `1e21` formats as "1000000000000000000000" instead of "1e+21"
 *
 * @param n The number to format.
 */
export function fullWide(n: FormattableNumber): string {
    if (typeof n === 'bigint') return n.toString()

    if (typeof n === 'string') {
        if (n === 'Infinity' || n === '+Infinity') return MAX_SAFE_INTEGER_STRING
        if (n === '-Infinity') return MIN_SAFE_INTEGER_STRING
        if (!DECIMAL_STRING.test(n)) return '0'

        return FULL_WIDE_FORMAT.format(n)
    }

    if (n === Number.POSITIVE_INFINITY) return MAX_SAFE_INTEGER_STRING
    if (n === Number.NEGATIVE_INFINITY) return MIN_SAFE_INTEGER_STRING
    if (!Number.isFinite(n)) return '0'

    return FULL_WIDE_FORMAT.format(n)
}
