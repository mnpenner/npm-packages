import {bufToInt} from './buffer-to-bigint'
import assert from 'assert'


function calcCharsPerChunk(bytesPerChunk: number, base: bigint): number {
    const min = 2n ** BigInt(8 * bytesPerChunk)
    let c = 1
    let val = base
    for(; ;) {
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
function padUint8ArrayRight(buf: Uint8Array, length: number): Uint8Array {
    // return buf.slice(start, start + length)
    if(buf.length >= length) return buf
    const padded = new Uint8Array(length)
    padded.set(buf, 0)
    return padded
}


function padArrayRight<T>(chunk: T[], maxLength: number, fill: T): T[] {
    if(chunk.length >= maxLength) return chunk
    return chunk.concat(Array(maxLength - chunk.length).fill(fill))
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
            assert(this._alphabet.length ** this._charsPerChunk >= 2 ** (8 * bytesPerChunk))
        }
        assert(this._charsPerChunk >= this._bytesPerChunk, `Compression is currently not supported. bytesPerChunk=${bytesPerChunk}, charsPerChunk=${this._charsPerChunk}`)
    }

    get base() {
        return this._base
    }

    get alphabet() {
        return this._alphabet
    }

    get bytesPerChunk() {
        return this._bytesPerChunk
    }

    get charsPerChunk() {
        return this._charsPerChunk
    }

    encode(arr: string | ArrayLike<number>): string {
        if(!arr?.length) {
            return ""
        }

        const buf = typeof arr === 'string' ? new TextEncoder().encode(arr) : Uint8Array.from(arr)
        let i = 0

        let result: string[] = []

        do {
            const chunk = buf.slice(i, i + this._bytesPerChunk)
            let val = bufToInt(padUint8ArrayRight(chunk, this._bytesPerChunk))
            result.push(...this.intToStrPadded(val))
            if(chunk.length < this._bytesPerChunk) {
                const missingBytes = this._bytesPerChunk - chunk.length
                // console.log(this._charsPerChunk,this._bytesPerChunk,missingBytes,result)
                return result.slice(0, -missingBytes).join('')
            }
            i += this._bytesPerChunk
        } while(i < buf.length)

        return result.join('')
    }


    decode(str: ArrayLike<string>): Uint8Array {
        if(!str?.length) return new Uint8Array()
        const out: number[] = []
        let i = 0
        const arr = toArray(str)
        while(i < arr.length) {
            const chunk = arr.slice(i, i + this._charsPerChunk)

            if(chunk.length === this._charsPerChunk) {
                const num = this.arrToInt(chunk)
                for(let j = this._bytesPerChunk - 1; j >= 0; j--) {
                    out.push(Number((num >> BigInt(8 * j)) & 0xFFn))
                }
            } else {
                const missing = this._charsPerChunk - chunk.length
                let num = this.arrToInt(padArrayRight(chunk, this._charsPerChunk, this._alphabet[this._alphabet.length - 1]))
                num >>= BigInt(8 * missing)
                const byteCount = this._bytesPerChunk - missing
                for(let j = byteCount - 1; j >= 0; --j) {
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

    private intToStrPadded(val: bigint): string[] {
        const { _alphabet, _base, _charsPerChunk } = this
        const base = BigInt(_base)
        const out = new Array<string>(_charsPerChunk)

        for (let i = _charsPerChunk - 1; i >= 0; i--) {
            out[i] = _alphabet[Number(val % base)]
            val /= base
        }

        return out
    }
}

