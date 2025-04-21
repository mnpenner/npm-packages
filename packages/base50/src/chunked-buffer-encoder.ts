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
    private readonly alphabet: string[]
    private readonly reverse: Map<string, bigint>
    private readonly base: bigint
    private readonly bytesPerChunk: number
    private readonly charsPerChunk: number
    private readonly lengthChars: number

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
        // this.minValue = (1n<<(8n*BigInt(this.bytesPerChunk-1)))

        // this.minValue = 0n
        // this.minValue = (1n<<(8n*BigInt(this.bytesPerChunk-1)))
        // const tmp = Array(this.charsPerChunk).fill(this.alphabet[0])
        // tmp[0] = this.alphabet[1]
        // this.minValue = this.arrToInt(tmp)
        // this.minValue = this.base**BigInt(this.charsPerChunk) - (1n<<(8n*BigInt(this.bytesPerChunk)))
        // IDEA: We can encode the offset in these wasted bits! The `minValue` just needs to be >= bytesPerChunk. Maybe encode it until the last chunk iff the # of bytes is not a multiple of bytesPerChunk? For base 64, it could be [0,-1,-2] bytes.

        this.lengthChars = computeLengthChars(this.alphabet.length)

        // console.log(this.base,this.minValue)
        // console.log(this.alphabet,this.bytesPerChunk, this.charsPerChunk,this.minValue,this.lengthChars)
    }

    encode(arr: ArrayLike<number>): string {
        if(!arr?.length) {
            return ""
        }

        const buf = Uint8Array.from(arr)
        let i = 0

        // TODO: encode the length as a compact uint instead! https://learn.microsoft.com/en-us/openspecs/sharepoint_protocols/ms-fsshttpb/8eb74ebe-81d1-4569-a29a-308a6128a52f
        // 0 = 0
        // 1 = read next 4 KiB worth of chars --- this is pointless for base 2, add rules based on base
        // If all 0, read next 16 MiB worth of chars, add remaining values from previous set
        // If all 0, read next 256 TiB worth of chars
        let result = padArrayLeft(this.intToArr(buf.length), this.lengthChars, this.alphabet[0]).join('')
        do {
            const chunk = buf.slice(i, i + this.bytesPerChunk)
            let val = bufToInt(padBuffer(chunk,this.bytesPerChunk))
            // if(chunk.length < this.bytesPerChunk) {
            //     const missingBytes = this.bytesPerChunk - chunk.length
            //     // val <<= 8n * BigInt(missingBytes)
            //     // FIXME: the final bytes are not necessarily 0. it works for base64 because everything aligns, but not for base 3.
            //     // What if we 'shift' the value first to pack the left bits instead of right?
            //     result += this.intToArr(val).slice(0,-missingBytes).join('')
            //     return result
            // }
            result += this.intToStr(val)
            console.log(chunk,padBuffer(chunk,this.bytesPerChunk), val, this.intToStr(val))
            // console.log(result)
            i += this.bytesPerChunk
        } while(i < buf.length)

        return result
    }

    private padStr(chunk: string[]): string[] {
        if(chunk.length >= this.charsPerChunk) return chunk
        return chunk.concat(Array(this.charsPerChunk - chunk.length).fill(this.alphabet[0]))
    }

    private padBuffer(buf: Uint8Array): Uint8Array {
        if(buf.length >= this.bytesPerChunk) return buf
        const padded = new Uint8Array(this.bytesPerChunk)
        padded.set(buf, 0)
        return padded
    }

    decode(str: ArrayLike<string>): Uint8Array {
        if(!str?.length) return new Uint8Array()
        // const out: number[] = []
        const arr = toArray(str)

        const lengthBytes = Number(this.arrToInt(arr.slice(0, this.lengthChars)))

        const out = new Uint8Array(lengthBytes)

        // console.log(lengthBytes,arr.slice(0, this.lengthChars))

        // console.log(str,this.lengthChars,lengthBytes,this.bytesPerChunk,this.charsPerChunk)
        let b = 0

        done: for (let i=this.lengthChars; /*i < arr.length*/; i += this.charsPerChunk) {
            // const chunkLen = Math.min(this.charsPerChunk, arr.length - i)
            // const chunk = arr.slice(i, i + chunkLen).join('')
            const chunk = padArrayRight(arr.slice(i, i+this.charsPerChunk),this.charsPerChunk,this.alphabet[0])

            const num = this.arrToInt(chunk)
            console.log('decode chunk',chunk,num,this.intToStr(num))
            console.log(this.intToStr(65536n),this.intToStr(4194304n))
            // console.log(arr,'chunk',i,chunk,num)
            // console.log(num)
            for (let j = this.bytesPerChunk - 1; j >= 0; --j) {
                out[b] = Number((num >> BigInt(8 * j)) & 0xFFn)
                if(++b === lengthBytes) break done
                // out.push(Number((num >> BigInt(8 * j)) & 0xFFn))
            }

        }

        return out
        // console.log('out',lengthBytes,out)6
        // console.log('out',lengthBytes,out)6
        console.log(lengthBytes,out)
        return new Uint8Array(out.slice(0,lengthBytes))
    }

    private arrToInt(arr: string[]): bigint {
        let num = 0n
        for(const ch of arr) {
            const val = this.reverse.get(ch)
            assert(val !== undefined, `reverse "${ch}"`)
            num = num * this.base + val
        }
        return num
    }

    private strToInt(str: ArrayLike<string>): bigint {
        return this.arrToInt(toArray(str))
    }

    private intToArr(num: number | bigint, padLength?: number): string[] {
        if(!num) {
            // Handle the case of 0 explicitly, padding to the full chunk length
            return [this.alphabet[0]]
        }
        let n = BigInt(num)

        let result: string[] = []
        do {
            const rem = n % this.base
            result.unshift(this.alphabet[Number(rem)])
            n /= this.base
        } while(n > 0n)

        return result
    }

    private intToStr(num: number | bigint): string {
        return padArrayRight(this.intToArr(num), this.charsPerChunk, this.alphabet[0]).join('')


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
