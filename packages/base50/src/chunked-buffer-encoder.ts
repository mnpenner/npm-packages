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

    encode(input: string | ArrayLike<number>): string {
        const buf = typeof input === 'string'
            ? new TextEncoder().encode(input)
            : Uint8Array.from(input)
        const { _bytesPerChunk: B, _charsPerChunk: C, _alphabet: A, _base: BASE } = this
        if (buf.length === 0) return ''

        const numChunks = Math.ceil(buf.length / B)
        const out: string[] = new Array(numChunks * C)
        let outPos = 0

        for (let i = 0; i < buf.length; i += B) {
            // assemble big-endian BigInt
            let val = 0n
            for (let j = 0; j < B; j++) {
                val = (val << 8n) + BigInt(buf[i + j] || 0)
            }

            // extract C digits (lsb→msb into temp slots)
            let slotBase = outPos + C
            for (let k = C - 1; k >= 0; --k) {
                const idx = Number(val % BASE)
                out[--slotBase] = A[idx]
                val /= BASE
            }

            // handle last, trim padding
            if (i + B > buf.length) {
                const over = i + B - buf.length
                return out.slice(0, outPos + C - over).join('')
            }

            outPos += C
        }

        return out.join('')
    }


    decode(input: string | ArrayLike<string>): Uint8Array {
        const arr = Array.from(input as any) as string[]
        const len = arr.length
        if (len === 0) return new Uint8Array()

        const B = this._bytesPerChunk
        const C = this._charsPerChunk
        const BASE = this._base
        const REV = this._reverse
        const LAST = this._alphabet[this._alphabet.length - 1]

        const full  = Math.floor(len / C)
        const rem   = len - full * C
        const miss  = rem ? C - rem : 0
        const outLen = full * B + (rem ? B - miss : 0)
        const out = new Uint8Array(outLen)

        let pos = 0
        for (let i = 0; i < len; i += C) {
            let num = 0n
            const isLast = i + C > len

            // build BigInt (pad with LAST on final chunk)
            for (let j = 0; j < C; ++j) {
                const ch = i + j < len ? arr[i + j] : LAST
                const v = REV.get(ch)!
                num = num * BASE + v
            }

            if (isLast) num >>= 8n * BigInt(miss)

            const count = isLast ? B - miss : B
            for (let b = count - 1; b >= 0; --b) {
                out[pos++] = Number((num >> (8n * BigInt(b))) & 0xFFn)
            }
        }

        return out
    }
}

