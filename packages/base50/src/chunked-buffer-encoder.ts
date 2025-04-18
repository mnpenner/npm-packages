import {BASE64URL, MPEN50} from './alphabets'
import {bufToInt} from './buffer-to-bigint'
import assert from 'assert'

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

function calcCharsPerChunk(bytesPerChunk: number, base: bigint): number {
    const min = 2n**BigInt(8*bytesPerChunk)
    let c = 1
    let val = base
    for(;;) {
        if(val >= min) return c
        val *= base
        ++c
    }
}

/**
 * Pad a Uint8Array with zeros up to the given length.
 * @param buf
 * @param length
 */
function padRight(buf: Uint8Array,  length: number): Uint8Array {
    // return buf.slice(start, start + length)
    if(buf.length >= length) return buf
    const padded = new Uint8Array(length)
    padded.set(buf, 0)
    return padded
}

function slice(buf: Uint8Array, start:number, length: number): Uint8Array {
    // return buf.slice(start, start + length)
    const chunk = buf.slice(start, start + length)
    if (chunk.length >= length) return chunk
    const padded = new Uint8Array(length)
    padded.set(chunk, 0)
    return padded
}

export class ChunkedBufferEncoder {
    private readonly alphabet: string[]
    private readonly reverse: Map<string, bigint>
    private readonly base: bigint
    private readonly bytesPerChunk: number
    private readonly charsPerChunk: number

    constructor(alphabet: ArrayLike<string>, bytesPerChunk: number, charsPerChunk?: number) {
        this.alphabet = Array.from(alphabet)
        assert(this.alphabet.length >= 2)
        this.reverse = new Map(this.alphabet.map((ch, i) => [ch, BigInt(i)]))
        this.base = BigInt(this.alphabet.length)
        this.bytesPerChunk = bytesPerChunk
        if(charsPerChunk == null) {
            this.charsPerChunk = calcCharsPerChunk(bytesPerChunk, this.base)
        } else {
            this.charsPerChunk = charsPerChunk
            assert(this.alphabet.length**this.charsPerChunk >= 2**(8*bytesPerChunk))
        }
    }

    encode(arr: ArrayLike<number>): string {
        if(!arr?.length) {
            return ""
        }

        const buf = Uint8Array.from(arr)
        let i = 0

        let result = ''
        do {
            const chunkBytes = buf.slice(i, i + this.bytesPerChunk)
            let val = bufToInt(chunkBytes)
            if(chunkBytes.length < this.bytesPerChunk) {
                const missingBytes = this.bytesPerChunk - chunkBytes.length
                val <<= 8n * BigInt(missingBytes)
                result += this.intToStr(val).slice(0,-missingBytes)
                return result
            }
            result += this.intToStr(val)
            i += this.bytesPerChunk
        } while(i < buf.length)

        return result
    }

    decode(str: string): Uint8Array {
        if(!str?.length) {
            return new Uint8Array()
        }

        const arr = Array.from(str)


        let i = 0
        const resultBytes: number[] = []

        do {
            // Parse a chunk of the encoded string into a bigint
            const chunk = arr.slice(i, i + this.charsPerChunk)
            let val = this.strToInt(chunk)

            if(chunk.length < this.charsPerChunk) {
                const missingChars = this.charsPerChunk - chunk.length
                val *= this.base**BigInt(missingChars)
            }

            // Convert the bigint to a big-endian byte array
            const chunkBytes = []
            let temp = val

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



        return new Uint8Array(resultBytes)
    }

    private strToInt(str: ArrayLike<string>): bigint {
        let num = 0n
        for(const ch of Array.from(str)) {
            num = num * this.base + this.reverse.get(ch)!
        }
        return num
    }


    private intToStr(num: number | bigint): string {
        if(!num) {
            // Handle the case of 0 explicitly, padding to the full chunk length
            return this.alphabet[0].repeat(this.charsPerChunk)
        }
        let n = BigInt(num)

        let result = ''
        do {
            const rem = n % this.base
            result = this.alphabet[Number(rem)] + result
            n /= this.base
        } while(n > 0n)

        return result.padStart(this.charsPerChunk, this.alphabet[0])
    }

}


if(import.meta.main) {
    // const encoder = new ChunkedBufferEncoder(MPEN50, 7, 10)
    const base64 = new ChunkedBufferEncoder(BASE64URL, 3, 4)

    console.log(base64.encode(Buffer.from("Many hands make light work.")))
}
