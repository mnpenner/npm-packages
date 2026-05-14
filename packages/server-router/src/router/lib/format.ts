export type FormattableNumber = Parameters<Intl.NumberFormat['format']>[0]

const FULL_WIDE_FORMAT = new Intl.NumberFormat('en-US', {
    useGrouping: false,
    maximumFractionDigits: 20,
})

const DECIMAL_STRING = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/

export function fullWide(n: FormattableNumber): string {
    if (typeof n === 'bigint') return n.toString()

    if (typeof n === 'string') {
        if (!DECIMAL_STRING.test(n)) return '0'

        return FULL_WIDE_FORMAT.format(n)
    }

    if (!Number.isFinite(n)) return '0'

    return FULL_WIDE_FORMAT.format(n)
}
