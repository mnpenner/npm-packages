// Modified from https://github.com/ljharb/shell-quote/blob/3344a047dd1e95f71c4ca27522cbfd05c56277e0/quote.js

interface Op {
    op: string
}

export function shellQuote(s: string|Op): string {
    if (s === '') {
        return "''"
    }
    if (s && typeof s === 'object') {
        return s.op.replace(/(.)/g, '\\$1')
    }
    if (/["\s\\]/.test(s) && !/'/.test(s)) {
        return "'" + s.replace(/(')/g, '\\$1') + "'"
    }
    if (/["'\s]/.test(s)) {
        return '"' + s.replace(/(["\\$`!])/g, '\\$1') + '"'
    }
    return String(s).replace(/([A-Za-z]:)?([#!"$&'()*,:;<=>?@[\\\]^`{|}])/g, '$1\\$2')
}

export function shellQuoteArgs(xs: (string|Op)[]): string {
    return xs.map(shellQuote).join(' ')
}
