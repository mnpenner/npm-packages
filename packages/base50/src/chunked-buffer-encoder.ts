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

function toArray<T>(arr: ArrayLike<T>): T[] {
    return Array.isArray(arr) ? arr : Array.from(arr)
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
        this.alphabet = toArray(alphabet)
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
        // console.log(this.alphabet,this.bytesPerChunk, this.charsPerChunk)
    }

    encode(arr: ArrayLike<number>): string {
        if(!arr?.length) {
            return ""
        }

        const buf = Uint8Array.from(arr)
        let i = 0

        let result = ''
        do {
            const chunk = buf.slice(i, i + this.bytesPerChunk)
            let val = bufToInt(chunk)
            if(chunk.length < this.bytesPerChunk) {
                const missingBytes = this.bytesPerChunk - chunk.length
                val <<= 8n * BigInt(missingBytes)
                result += this.intToArr(val).slice(0,-missingBytes).join('')
                return result
            }
            result += this.intToStr(val)
            i += this.bytesPerChunk
        } while(i < buf.length)

        return result
    }

    private padEnd(chunk: string[]): string[] {
        if(chunk.length >= this.charsPerChunk) return chunk
        return chunk.concat(Array(this.charsPerChunk - chunk.length).fill(this.alphabet[0]))
    }

    decode(str: ArrayLike<string>): Uint8Array {
        if(!str?.length) return new Uint8Array()
        const out: number[] = []
        let i = 0
        const arr = toArray(str)
        while (i < arr.length) {
            // const chunkLen = Math.min(this.charsPerChunk, arr.length - i)
            // const chunk = arr.slice(i, i + chunkLen).join('')
            const chunk = arr.slice(i, i+this.charsPerChunk)


            if (chunk.length === this.charsPerChunk) {
                const num = this.arrToInt(chunk)
                for (let j = this.bytesPerChunk - 1; j >= 0; j--) {
                    out.push(Number((num >> BigInt(8 * j)) & 0xFFn))
                }
            } else {
                const missing = this.charsPerChunk - chunk.length
                let num = this.arrToInt(this.padEnd(chunk))
                num >>= BigInt(8 * missing)
                const byteCount = this.bytesPerChunk - missing
                for (let j = byteCount - 1; j >= 0; --j) {
                    out.push(Number((num >> BigInt(8 * j)) & 0xFFn))
                }
                break
            }

            i += chunk.length
        }

        return new Uint8Array(out)
    }

    private arrToInt(arr: string[]): bigint {
        let num = 0n
        for(const ch of arr) {
            num = num * this.base + this.reverse.get(ch)!
        }
        return num
    }

    private strToInt(str: ArrayLike<string>): bigint {
        return this.arrToInt(toArray(str))
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

    private intToArr(num: number | bigint): string[] {
        if(!num) {
            // Handle the case of 0 explicitly, padding to the full chunk length
            return Array(this.charsPerChunk).fill(this.alphabet[0])
        }
        let n = BigInt(num)

        let result: string[] = []
        do {
            const rem = n % this.base
            result.unshift(this.alphabet[Number(rem)])
            n /= this.base
        } while(n > 0n)

        while (result.length < this.charsPerChunk) {
            result.unshift(this.alphabet[0])
        }
        return result
    }
}


if(import.meta.main) {
    // const encoder = new ChunkedBufferEncoder(MPEN50, 7, 10)
    const base64 = new ChunkedBufferEncoder(BASE64URL, 3, 4)

    console.log(base64.encode(Buffer.from("Many hands make light work.")))
}
