export type FormattableNumber = Parameters<Intl.NumberFormat['format']>[0]


export function fullWide(n: FormattableNumber): string {
    n = Number(n)
    if(!Number.isFinite(n)) return '0'
    try {
        return n.toLocaleString('en-US', {useGrouping: false, maximumFractionDigits: 20})
    } catch {
        return n.toFixed(14).replace(/\.?0+$/, '')
    }
}
