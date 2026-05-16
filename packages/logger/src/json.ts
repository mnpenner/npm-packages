

// FIXME: needs to handle all data types, even if its not perfect/lossless
export function jsonAscii(value: unknown): string {
    return JSON.stringify(value).replace(/[^\x00-\x7F]/gu, (c) => {
        const cp = c.codePointAt(0)!

        if (cp <= 0xffff) {
            return '\\u' + cp.toString(16).padStart(4, '0')
        }

        const n = cp - 0x10000
        const hi = 0xd800 + (n >> 10)
        const lo = 0xdc00 + (n & 0x3ff)

        return '\\u' + hi.toString(16).padStart(4, '0') + '\\u' + lo.toString(16).padStart(4, '0')
    })
}

export function jsAsciiString(obj: string) {
    let numDouble = 0
    let numSingle = 0
    for (let i = 0; i < obj.length; i++) {
        if (obj[i] === '"') ++numDouble
        else if (obj[i] === "'") ++numSingle
    }
    const useSingle = numDouble > numSingle
    const quote = useSingle ? "'" : '"'
    const quoteCode = useSingle ? 0x27 : 0x22

    let result =
        quote +
        Array.from(obj)
            .map((ch) => {
                const cp = ch.codePointAt(0)!
                switch (cp) {
                    case 0x08:
                        return '\\b'
                    case 0x0c:
                        return '\\f'
                    case 0x0a:
                        return '\\n'
                    case 0x0d:
                        return '\\r'
                    case 0x09:
                        return '\\t'
                    case 0x0b:
                        return '\\v'
                    case quoteCode:
                        return '\\' + ch
                    case 0x5c:
                        return '\\\\'
                }
                if (cp >= 32 && cp <= 126) {
                    return ch
                }
                if (cp <= 0xff) {
                    return '\\x' + cp.toString(16).padStart(2, '0')
                }
                if (cp <= 0xffff) {
                    return '\\u' + cp.toString(16).padStart(4, '0')
                }
                return '\\u{' + cp.toString(16) + '}'
            })
            .join('') +
        quote

    return result
}
