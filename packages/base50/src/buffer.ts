import {charToNum, numToChar} from './alphabet'
import assert from 'node:assert'

type BufferType = Buffer | Uint8Array | number[]

const last6 = 0b00111111

const first2 = 0b11000000
const all1s = 0xFFFFFFFF
// const mask4 = 0b11110000
// const mask2 = 0b11000000

function toBinary(num: number): string {
    let binaryStr = num.toString(2);
    const padding = 8 - (binaryStr.length % 8);

    if (padding !== 8) {
        binaryStr = '0'.repeat(padding) + binaryStr;
    }

    // Insert spaces between each octet
    return binaryStr.match(/.{8}/g)?.join(' ') ?? binaryStr;
}

function rightAlignedMask(N: number) {
    return (1 << N) - 1;
}

export function bufToBase50(buf: Iterable<number>): string {
    let out = '';
    let carry: number | null = null;

    for (const sex of chunk6bits(buf)) {
        if(carry != null) {
            out += numToChar(carry)
            carry = null
        }

        if (sex < 49) {
            out += numToChar(sex);
        } else {
            out += numToChar(49);
            carry = sex - 49;
        }
    }

    if (carry != null) {
        out += numToChar(carry);
    }

    return out;
}
// console.log(charToNum('0'))

export function base50ToBuf(base50Str: string): Uint8Array {
    let sextets:number[] = []
    let carry = 0
    let divisor = 15

    for(let i=0; i<base50Str.length; ++i) {
        const num = charToNum(base50Str[i])+carry
        if(num < 49) {
            sextets.push(num)
            carry = 0
        } else {
            ++i
            assert(i< base50Str.length)
            const num2 = charToNum(base50Str[i])
            const rem = num2 % divisor;
            sextets.push(num+rem)
            carry = (num2-rem)/divisor;
            // console.log(carry)
        }
    }

    if(carry > 0) {
        sextets.push(carry)
    }

    // console.log(sextets)
    // console.log([...sextets2buf(sextets)])
    return new Uint8Array(sextets2buf(sextets))
}

// console.log(numToChar(0b1111))
// console.log(base50ToBuf('Zg0Zc'))  // [0b1111_1100,0b0000_1111] == [252, 15]

export function* sextets2buf(sextets: Iterable<number>) {
    let phase = 0
    let carry = 0

    for(const val of sextets) {
        switch(phase) {
            case 0:
                carry = val << 2
                phase = 1
                break
            case 1:
                // 6 bits in the carry, want the first 2 bits of val
                yield carry | (val >> 4)
                carry = (val & 0b0000_1111) << 4
                phase = 2
                break
            case 2:
                // 4 bits in the carry, want the first 4 bits of val
                // console.log(carry<<4,val)
                yield carry | (val >> 2)
                carry = (val & 0b0000_0011) << 6
                phase = 3
                break
            case 3:
                // 2 bits in the carry, want all 6 bits of val
                yield carry | val
                phase = 0
                break
        }
    }
    if(carry !== 0) {
        yield carry
    }
}


export function* chunk6bits(buf: Iterable<number>) {
    let phase = 0
    let carry = 0

    for(const val of buf) {
        switch(phase) {
            case 0:
                yield (val & 0b1111_1100) >> 2
                carry = (val & 0b0000_0011) << 4
                phase = 1
                break
            case 1:
                yield carry | ((val & 0b1111_0000) >> 4)
                carry = (val & 0b0000_1111) << 2
                phase = 2
                break
            case 2:
                yield carry | ((val & 0b1100_0000) >> 6)
                yield val & 0b0011_1111
                phase = 0
                break
        }
    }
    if(phase !== 0) {
        yield carry
    }
}
