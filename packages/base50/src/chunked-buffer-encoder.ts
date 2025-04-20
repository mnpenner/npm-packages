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

    decode(str: ArrayLike<string>): Uint8Array {
        if(!str?.length) return new Uint8Array()
        const out: number[] = []
        let i = 0
        const arr = Array.from(str)
        while (i < arr.length) {
            const chunkLen = Math.min(this.charsPerChunk, arr.length - i)
            const chunk = arr.slice(i, i + chunkLen).join('')
            i += chunkLen

            if (chunkLen === this.charsPerChunk) {
                const num = this.strToInt(chunk)
                for (let j = this.bytesPerChunk - 1; j >= 0; j--) {
                    out.push(Number((num >> BigInt(8 * j)) & 0xFFn))
                }
            } else {
                const missing = this.charsPerChunk - chunkLen
                let num = this.strToInt(chunk + this.alphabet[0].repeat(missing))
                num >>= BigInt(8 * missing)
                const byteCount = this.bytesPerChunk - missing
                for (let j = byteCount - 1; j >= 0; --j) {
                    out.push(Number((num >> BigInt(8 * j)) & 0xFFn))
                }
            }
        }

        return new Uint8Array(out)
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
