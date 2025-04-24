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
function padUint8ArrayRight(buf: Uint8Array,  length: number): Uint8Array {
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

function padArrayRight<T>(chunk: T[], maxLength: number, fill: T): T[] {
    if(chunk.length >= maxLength) return chunk
    return chunk.concat(Array(maxLength - chunk.length).fill(fill))
}

function padArrayLeft<T>(chunk: T[], maxLength: number, fill: T): T[] {
    if(chunk.length >= maxLength) return chunk
    return Array(maxLength - chunk.length).fill(fill).concat(chunk)
}

function padBuffer(buf: Uint8Array, maxLength: number): Uint8Array {
    if(buf.length >= maxLength) return buf
    const padded = new Uint8Array(maxLength)
    padded.set(buf, 0)
    return padded
}


function computeLengthChars(base: number): number {
    return Math.ceil(50 / Math.log2(base))
}



export class ChunkedBufferEncoder {
    private readonly _alphabet: string[]
    private readonly _reverse: Map<string, bigint>
    private readonly _base: bigint
    private readonly _bytesPerChunk: number
    private readonly _charsPerChunk: number

    constructor(alphabet: ArrayLike<string>, bytesPerChunk: number, charsPerChunk?: number) {
        this._alphabet = toArray(alphabet)
        assert(this._alphabet.length >= 2)
        this._reverse = new Map(this._alphabet.map((ch, i) => [ch, BigInt(i)]))
        this._base = BigInt(this._alphabet.length)
        this._bytesPerChunk = bytesPerChunk
        if(charsPerChunk == null) {
            this._charsPerChunk = calcCharsPerChunk(bytesPerChunk, this._base)
        } else {
            this._charsPerChunk = charsPerChunk
            assert(this._alphabet.length**this._charsPerChunk >= 2**(8*bytesPerChunk))
        }
        // this.minValue = (1n<<(8n*BigInt(this.bytesPerChunk-1)))

        // this.minValue = 0n
        // this.minValue = (1n<<(8n*BigInt(this.bytesPerChunk-1)))
        // const tmp = Array(this.charsPerChunk).fill(this.alphabet[0])
        // tmp[0] = this.alphabet[1]
        // this.minValue = this.arrToInt(tmp)
        // this.minValue = this.base**BigInt(this.charsPerChunk) - (1n<<(8n*BigInt(this.bytesPerChunk)))
        // IDEA: We can encode the offset in these wasted bits! The `minValue` just needs to be >= bytesPerChunk. Maybe encode it until the last chunk iff the # of bytes is not a multiple of bytesPerChunk? For base 64, it could be [0,-1,-2] bytes.

        // TODO: how does Ascii85 deal with this? https://en.wikipedia.org/wiki/Ascii85
        // It pads with the *highest value* char when decoding!  <====================================================
        // this.lengthChars = computeLengthChars(this._alphabet.length)
        // this.maxTruncate = Math.ceil((this.bytesPerChunk-1) / Math.log2(this.alphabet.length))

        // console.log(this.base,this.minValue)
        // console.log(this.alphabet,this.bytesPerChunk, this.charsPerChunk,this.minValue,this.lengthChars)
    }

    get base() {
        return this._base
    }

    get alphabet() {
        return this._alphabet
    }

    encode(arr: ArrayLike<number>): string {
        if(!arr?.length) {
            return ""
        }

        const buf = Uint8Array.from(arr)
        let i = 0

        let result = ''



        do {
            const chunk = buf.slice(i, i + this._bytesPerChunk)
            let val = bufToInt(padUint8ArrayRight(chunk, this._bytesPerChunk))

            result += this.intToStrPadded2(val)
            // console.log(chunk,val,result,padUint8ArrayRight(chunk, this.bytesPerChunk))
            if(chunk.length < this._bytesPerChunk) {
                const missingBytes = this._bytesPerChunk - chunk.length
                return result.slice(0, -missingBytes)
            }
            i += this._bytesPerChunk
        } while(i < buf.length)

        return result
    }

    private padStr(chunk: string[]): string[] {
        if(chunk.length >= this._charsPerChunk) return chunk
        return chunk.concat(Array(this._charsPerChunk - chunk.length).fill(this._alphabet[0]))
    }

    private padBuffer(buf: Uint8Array): Uint8Array {
        if(buf.length >= this._bytesPerChunk) return buf
        const padded = new Uint8Array(this._bytesPerChunk)
        padded.set(buf, 0)
        return padded
    }

    decode(str: ArrayLike<string>): Uint8Array {
        if(!str?.length) return new Uint8Array()
        const out: number[] = []
        let i = 0
        const arr = toArray(str)
        while (i < arr.length) {
            // const chunkLen = Math.min(this.charsPerChunk, arr.length - i)
            // const chunk = arr.slice(i, i + chunkLen).join('')
            const chunk = arr.slice(i, i+this._charsPerChunk)


            if (chunk.length === this._charsPerChunk) {
                const num = this.arrToInt(chunk)
                for (let j = this._bytesPerChunk - 1; j >= 0; j--) {
                    out.push(Number((num >> BigInt(8 * j)) & 0xFFn))
                }
            } else {
                const missing = this._charsPerChunk - chunk.length
                let num = this.arrToInt(padArrayRight(chunk,this._charsPerChunk,this._alphabet[this._alphabet.length-1]))
                num >>= BigInt(8 * missing)
                const byteCount = this._bytesPerChunk - missing
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
            const val = this._reverse.get(ch)
            assert(val !== undefined, `reverse "${ch}"`)
            num = num * this._base + val
        }
        return num
    }

    private strToInt(str: ArrayLike<string>): bigint {
        return this.arrToInt(toArray(str))
    }

    private intToArrUnpadded(num: number | bigint, padLength?: number): string[] {
        if(!num) {
            // Handle the case of 0 explicitly, padding to the full chunk length
            return [this._alphabet[0]]
        }
        let n = BigInt(num)

        let result: string[] = []
        do {
            const rem = n % this._base
            result.unshift(this._alphabet[Number(rem)])
            n /= this._base
        } while(n > 0n)

        return result
    }

    private intToStrUnpadded(num: number | bigint): string {
        return this.intToArrUnpadded(num).join('')
    }

    private intToStrPadded(num: number | bigint): string {
        return padArrayRight(this.intToArrUnpadded(num), this._charsPerChunk, this._alphabet[0]).join('')
    }

    private intToStrPadded2(val: bigint): string {
        const digits: string[] = []
        // 1) get LSB-first digits
        do {
            digits.push(this._alphabet[Number(val % BigInt(this._base))])
            val /= BigInt(this._base)
        } while (val > 0n)
        // 2) pad in LSB-first order
        while (digits.length < this._charsPerChunk) {
            digits.push(this._alphabet[0])
        }
        // 3) reverse into MSB-first
        digits.reverse()
        return digits.join('')
    }


    // private intToArr(num: number | bigint): string[] {
    //     if(!num) {
    //         // Handle the case of 0 explicitly, padding to the full chunk length
    //         return Array(this.charsPerChunk).fill(this.alphabet[0])
    //     }
    //     let n = BigInt(num)
    //
    //     let result: string[] = []
    //     do {
    //         const rem = n % this.base
    //         result.unshift(this.alphabet[Number(rem)])
    //         n /= this.base
    //     } while(n > 0n)
    //
    //     while (result.length < this.charsPerChunk) {
    //         result.unshift(this.alphabet[0])
    //     }
    //     return result
    // }
}


if(import.meta.main) {
    // const encoder = new ChunkedBufferEncoder(MPEN50, 7, 10)
    const base64 = new ChunkedBufferEncoder(BASE64URL, 3, 4)

    console.log(base64.encode(Buffer.from("Many hands make light work.")))
}
