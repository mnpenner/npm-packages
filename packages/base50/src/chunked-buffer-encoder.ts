import {BASE64URL, MPEN50} from './alphabets'
import {bufToInt} from './buffer-to-bigint'

function findHighestPowerOf2LessThanOrEqual(num: bigint | number): bigint {
    if(typeof num === 'number') {
        num = BigInt(num)
    }
    if(num <= 0n) {
        throw new Error('Input must be a positive number')
    }

    let result = 1n
    while(result * 2n <= num) {
        result *= 2n
    }
    return result
}


export class ChunkedBufferEncoder {
    private readonly alphabet: string[]
    private readonly reverse: Map<string, bigint>
    private readonly base: bigint
    private readonly bytesPerChunk: number
    private readonly charsPerChunk: number

    constructor(alphabet: ArrayLike<string>, bytesPerChunk: number, charsPerChunk: number) {
        this.alphabet = Array.from(alphabet)
        this.reverse = new Map(this.alphabet.map((ch, i) => [ch, BigInt(i)]))
        this.base = BigInt(this.alphabet.length)
        this.bytesPerChunk = bytesPerChunk
        this.charsPerChunk = charsPerChunk
    }

    encode(arr: ArrayLike<number>): string {
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

        const buf = Uint8Array.from(arr)
        let i = leadingZeros

        let result = ''
        do {
            const val = bufToInt(buf.slice(i, i + this.bytesPerChunk))
            result += this.intToStr(val)//.padStart(this.charsPerChunk, this.alphabet[0])
            i += this.bytesPerChunk
        } while(i < buf.length)
        return prefix+result
    }

    decode(str: string): Uint8Array {
        if(!str?.length) {
            return new Uint8Array()
        }

        const arr = Array.from(str)
        let leadingZeros = 0

        // Count leading zeros based on the alphabet's first character
        while(leadingZeros < arr.length && arr[leadingZeros] === this.alphabet[0]) {
            ++leadingZeros
        }

        // If the entire string is composed of the first character, return an array of zeros
        if(leadingZeros === arr.length) {
            return new Uint8Array(leadingZeros)
        }

        let i = leadingZeros
        const resultBytes: number[] = []

        do {
            // Parse a chunk of the encoded string into a bigint
            const chunk = this.strToInt(arr.slice(i, i + this.charsPerChunk))

            // Convert the bigint to a big-endian byte array
            const chunkBytes = []
            let temp = chunk

            while(temp > 0n) {
                chunkBytes.unshift(Number(temp & 0xFFn)) // Get the least significant byte
                temp >>= 8n // Shift right to process the next byte
            }

            // Ensure the chunkBytes array fills the required `bytesPerChunk` length
            while(chunkBytes.length < this.bytesPerChunk) {
                chunkBytes.unshift(0) // Prepend leading zeros if necessary
            }

            resultBytes.push(...chunkBytes)
            i += this.charsPerChunk
        } while(i < arr.length)

        // Prepend leading zero bytes to the final result
        const result = new Uint8Array(leadingZeros + resultBytes.length)
        result.set(resultBytes, leadingZeros)

        return result
    }

    private strToInt(str: ArrayLike<string>): bigint {
        let num = 0n
        for(const ch of Array.from(str)) {
            num = num * this.base + this.reverse.get(ch)!
        }
        return num
    }


    private intToStr(num: number | bigint): string {
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

}


if(import.meta.main) {
    // const encoder = new ChunkedBufferEncoder(MPEN50, 7, 10)
    const base64 = new ChunkedBufferEncoder(BASE64URL, 3, 4)

    console.log(base64.encode(Buffer.from("Many hands make light work.")))
}
