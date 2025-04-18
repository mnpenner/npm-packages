import {bufToInt, leBufToBigInt} from './buffer-to-bigint'

export class NumberEncoder {
    private readonly alphabet: string[]
    private readonly reverse: Map<string, bigint>
    private readonly base: bigint

    constructor(alphabet: ArrayLike<string>) {
        this.alphabet = Array.from(alphabet)
        this.reverse = new Map(this.alphabet.map((ch, i) => [ch, BigInt(i)]))
        this.base = BigInt(this.alphabet.length)
    }

    /**
     * Parse a string encoded in base N, converting to base 10.
     */
    strToInt(str: ArrayLike<string>): bigint {
        let num = 0n
        for(const ch of Array.from(str)) {
            num = num * this.base + this.reverse.get(ch)!
        }
        return num
    }

    /**
     * @deprecated Not needed.
     */
    leStrToInt(str: ArrayLike<string>): bigint {
        let num = 0n
        let mul = 1n
        for (const ch of Array.from(str)) {
            num += this.reverse.get(ch)! * mul
            mul *= this.base
        }
        return num
    }

    intToStr(num: number | bigint): string {
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

    strToBuf(str: ArrayLike<string>): Uint8Array {
        if (!str?.length) {
            return new Uint8Array()
        }

        const arr = Array.from(str)
        let leadingZeros = 0
        while (leadingZeros < arr.length && arr[leadingZeros] === this.alphabet[0]) {
            ++leadingZeros
        }

        let n = this.strToInt(arr)

        const bytes: number[] = []
        while (n > 0n) {
            bytes.unshift(Number(n & 0xFFn))
            n >>= 8n
        }

        const result = new Uint8Array(leadingZeros + bytes.length)
        result.set(bytes, leadingZeros)
        return result
    }

    /**
     * @deprecated Not sure this one makes sense anymore...
     */
    leStrToBuf(str: ArrayLike<string>): Uint8Array {
        if (!str?.length) {
            return new Uint8Array()
        }

        const arr = Array.from(str)
        let trailingZeros = 0
        while (
            trailingZeros < arr.length &&
            this.reverse.get(arr[arr.length - 1 - trailingZeros]) === 0n
            ) {
            ++trailingZeros
        }

        const payload = arr.slice(0, arr.length - trailingZeros)
        if (payload.length === 0) {
            return new Uint8Array(trailingZeros || 1)
        }

        let n = this.leStrToInt(payload)

        const bytes: number[] = []
        while (n > 0n) {
            bytes.push(Number(n & 0xFFn))
            n >>= 8n
        }

        // trailing zeros go at the end in little-endian
        while (trailingZeros-- > 0) {
            bytes.push(0)
        }

        return new Uint8Array(bytes)
    }

    /**
     * Calculate the maximum length of a string encoded in base N, given the
     * number of bytes it will take up.
     *
     * @param byteLength
     */
    maxLength(byteLength: number): number {
        const val = (1n<<BigInt(8*byteLength))-1n
        return Array.from(this.intToStr(val)).length
    }


    bufToStr(arr: ArrayLike<number>): string {
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
        const num = bufToInt(remainingBuffer)

        const encodedPart = this.intToStr(num)

        return prefix + encodedPart
    }

    /**
     * @deprecated Not sure this one makes sense anymore...
     */
    leBufToStr(arr: ArrayLike<number>): string {
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

        const encodedPart = this.intToStr(num)

        return prefix + encodedPart
    }

}
