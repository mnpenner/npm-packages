import {divqr} from './numbers'
import {alphabet, BASE, numToChar} from './alphabet'


type BufferType = Buffer | Uint8Array | number[]

export function bufToBase50(buf: BufferType): string {
    let accum = 0
    let carry = 0
    let out = ''
    for(let chunk of chunk6bits(buf)) {
        // if(chunk >= 50) {
        //     carry = chunk - 50
        //     chunk -= 50
        // } else {
        //     carry = 0
        // }
        // accum += 14
        out  += numToChar(chunk)
    }
    return out
}


const mask6 = 0b11111100
const mask4 = 0b11110000
const mask2 = 0b11000000

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
