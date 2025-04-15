import {beBufToBigInt, leBufToBigInt} from './buffer-to-bigint'

export class NumberEncoder {
    private readonly alphabet: string[]
    private readonly reverse: Map<string, bigint>
    private readonly base: bigint

    constructor(alphabet: ArrayLike<string>) {
        this.alphabet = Array.from(alphabet)
        this.reverse = new Map(this.alphabet.map((ch, i) => [ch, BigInt(i)]))
        this.base = BigInt(this.alphabet.length)
    }

    decodeToIntBE(str: ArrayLike<string>): bigint {
        let num = 0n
        for(const ch of Array.from(str)) {
            num = num * this.base + this.reverse.get(ch)!
        }
        return num
    }

    decodeToIntLE(str: ArrayLike<string>): bigint {
        let num = 0n
        let mul = 1n
        for (const ch of Array.from(str)) {
            num += this.reverse.get(ch)! * mul
            mul *= this.base
        }
        return num
    }

    encodeInt(num: number | bigint): string {
        let n = BigInt(num)
        if(n === 0n) return this.alphabet[0]
        let result = ''
        while(n > 0n) {
            const rem = n % this.base
            result = this.alphabet[Number(rem)] + result
            n /= this.base
        }
        return result
    }

    decodeBE(str: ArrayLike<string>): Uint8Array {
        if(!str?.length) {
            return new Uint8Array()
        }

        let num = this.decodeToIntBE(str)

        const bytes: number[] = []
        do {
            const byte = Number(num & 0xFFn)
            bytes.unshift(byte)
            num >>= 8n
        }while(num > 0n)

        return new Uint8Array(bytes)
    }

    decodeLE(str: ArrayLike<string>): Uint8Array {
        if (!str?.length) {
            return new Uint8Array()
        }

        let num = this.decodeToIntLE(str)

        const bytes: number[] = []
        do {
            const byte = Number(num & 0xFFn)
            bytes.push(byte)
            num >>= 8n
        } while (num > 0n)

        return new Uint8Array(bytes)
    }


    // TODO: rename to just "encode". This matches the buffer order
    encodeBE(arr: ArrayLike<number>): string {
        if(!arr?.length) {
            return ""
        }

        let leadingZeros = 0
        while(leadingZeros < arr.length && arr[leadingZeros] === 0) {
            ++leadingZeros
        }

        let prefix = this.alphabet[0].repeat(leadingZeros)

        if(leadingZeros === arr.length) {
            return prefix
        }

        const remainingBuffer = Uint8Array.from(arr).slice(leadingZeros)
        const num = beBufToBigInt(remainingBuffer)

        const encodedPart = this.encodeInt(num)

        return prefix + encodedPart
    }

    encodeLE(arr: ArrayLike<number>): string {
        if (!arr?.length) {
            return ""
        }

        let trailingZeros = 0
        while (trailingZeros < arr.length && arr[arr.length - 1 - trailingZeros] === 0) {
            ++trailingZeros
        }

        let prefix = this.alphabet[0].repeat(trailingZeros)

        if (trailingZeros === arr.length) {
            return prefix
        }

        const remainingBuffer = Uint8Array.from(arr).slice(0, arr.length - trailingZeros)
        const num = leBufToBigInt(remainingBuffer)

        const encodedPart = this.encodeInt(num)

        return prefix + encodedPart
    }

}
