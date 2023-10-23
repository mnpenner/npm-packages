import assert from 'assert'


const ZERO = '0'.codePointAt(0)
const a = 'a'.codePointAt(0)
const A = 'A'.codePointAt(0)


export const alphabet = '0123456789bcdfghjklmnpqrstvwxzBCDFGHJKLMNPQRSTVWXZ'

export const BASE = alphabet.length

const reverse = new Map<string,number>
for(let i=0; i<alphabet.length; ++i) {
    reverse.set(alphabet[i], i)
}


export function charToNum(ch: string): number {
    assert(ch?.length === 1)
    const value = reverse.get(ch)
    assert(value != null)
    return value
}

export function numToChar(num: number): string {
    return alphabet[num]
}
