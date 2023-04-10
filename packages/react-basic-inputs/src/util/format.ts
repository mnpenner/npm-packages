export function collapseWhitespace(str: string | nil): string {
    if(!str) return ''
    return str.replace(/\s+/gu, ' ').trim()
}
