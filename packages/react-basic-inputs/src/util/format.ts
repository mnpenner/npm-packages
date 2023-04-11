export function collapseWhitespace(str: string | nil): string {
    if(!str) return ''
    return str.replace(/\s+/gu, ' ').trim()
}


export function fullWide(n: number): string {
    try {
        return n.toLocaleString('en-US', {useGrouping: false, maximumFractionDigits: 20})
    } catch {
        return n.toFixed(14).replace(/\.?0+$/, '')
    }
}
