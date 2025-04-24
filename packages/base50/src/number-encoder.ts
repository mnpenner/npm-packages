import {u8ToInt} from './buffer-to-bigint'

export class NumberEncoder {
    private readonly _alphabet: string[]
    private readonly _reverse: Map<string, bigint>
    private readonly _base: bigint
    private readonly _log2Base: number
    private readonly _floatPrecision: number
    private readonly _negSign: string
    private readonly _decSep: string



    constructor(alphabet: ArrayLike<string>, negativeSign='-', decimalSeparator='.') {
        this._alphabet = Array.from(alphabet)
        this._reverse = new Map(this._alphabet.map((ch, i) => [ch, BigInt(i)]))
        this._base = BigInt(this._alphabet.length)
        this._log2Base = Math.log2(alphabet.length)
        this._floatPrecision = Math.ceil(53 / this._log2Base)
        this._negSign = negativeSign
        this._decSep = decimalSeparator
    }

    decodeInt(str: ArrayLike<string>): bigint {
        // split into symbols (handles surrogate pairs)
        const arr = typeof str === "string"
            ? Array.from(str)
            : Array.isArray(str)
                ? str
                : Array.from(str);

        const base = this._base;
        const rev  = this._reverse;
        let num    = 0n;
        let i      = 0;
        let neg    = false;

        // negative?
        if (arr[0] === this._negSign) {
            neg = true;
            i   = 1;
        }

        for (const len = arr.length; i < len; ++i) {
            num = num * base + rev.get(arr[i])!;
        }

        return neg ? -num : num;
    }

    encodeInt(input: number | bigint): string {
        let n = BigInt(input);
        const A    = this._alphabet;
        const base = this._base;
        if (n === 0n) return A[0];

        let neg = false;
        if (n < 0n) {
            neg = true;
            n   = -n;
        }

        const digits: string[] = [];
        while (n > 0n) {
            digits.push(A[Number(n % base)]);
            n /= base;
        }
        digits.reverse();

        const s = digits.join("");
        return neg ? this._negSign + s : s;
    }

    /**
     * Encode a JS number (float) into your base-N alphabet.
     * @param x any finite number
     */
    encodeFloat(x: number): string {
        if (!Number.isFinite(x)) throw new Error("Non-finite")
        const sign = x < 0 ? this._negSign : ""
        x = Math.abs(x)
        const i     = Math.trunc(x)
        const f     = x - i
        const intStr = this.encodeInt(i)
        if (f === 0) return sign + intStr

        const A     = this._alphabet
        const baseN = Number(this._base)
        let rem     = f
        const digs: string[] = []
        for (let k = 0; k < this._floatPrecision; ++k) {
            rem *= baseN
            const d = Math.floor(rem)
            digs.push(A[d])
            rem -= d
            if (rem === 0) break
        }

        return sign + intStr + this._decSep + digs.join("")
    }


    /**
     * Decode a base-N float string back to JS number.
     */
    decodeFloat(s: string): number {
        const arr = Array.from(s)              // preserves emojis/etc.
        let sign = 1
        if (arr[0] === this._negSign /*|| arr[0] === "+"*/) {
            sign = arr.shift() === this._negSign ? -1 : 1
        }

        const dot = arr.indexOf(this._decSep)
        const intArr  = dot >= 0 ? arr.slice(0, dot)       : arr
        const fracArr = dot >= 0 ? arr.slice(dot + 1)      : []

        const iBig = this.decodeInt(intArr)  // your optimized decodeInt
        let fracN = 0
        let denom = 1
        const baseNum = Number(this._base)
        for (const ch of fracArr) {
            fracN = fracN * baseNum + Number(this._reverse.get(ch)!)
            denom *= baseNum
        }

        return sign * (Number(iBig) + (denom > 1 ? fracN / denom : 0))
    }


    decodeBuf(str: ArrayLike<string>): Uint8Array {
        if(!str?.length) return new Uint8Array()

        // split into real characters (handles emojis, etc.)
        const arr = Array.from(str)
        const len = arr.length
        const zeroChar = this._alphabet[0]

        // count leading-zero “digits”
        let lz = 0
        while(lz < len && arr[lz] === zeroChar) ++lz
        if(lz === len) return new Uint8Array(lz)

        // 1) build BigInt from base-N digits
        let num = 0n
        const base = this._base
        const rev = this._reverse
        for(let i = lz; i < len; ++i) {
            num = num * base + rev.get(arr[i])!
        }

        // 2) determine byte count
        let tmp = num
        let bc = 0
        while(tmp > 0n) {
            tmp >>= 8n
            ++bc
        }

        // 3) allocate & fill (leading zeros auto-zero)
        const out = new Uint8Array(lz + bc)
        let idx = out.length - 1
        while(num > 0n) {
            out[idx--] = Number(num & 0xFFn)
            num >>= 8n
        }

        return out
    }


    /**
     * Calculate the maximum length of a string encoded in base N, given the
     * number of bytes it will take up.
     *
     * @param byteLength
     */
    maxLength(byteLength: number): number {
        // original would produce 1 for 0 bytes
        if(byteLength === 0) return 1
        return Math.ceil((8 * byteLength) / this._log2Base)
    }


    encodeBuf(arr: ArrayLike<number>): string {
        const len = arr.length
        if(len === 0) return ""

        const A = this._alphabet
        const BASE = this._base
        const zero = A[0]

        // ensure Uint8Array view
        const u8 = arr instanceof Uint8Array
            ? arr
            : Uint8Array.from(arr as number[])

        // count leading zero bytes
        let lz = 0
        while(lz < u8.length && u8[lz] === 0) ++lz
        if(lz === u8.length) {
            // all zeros
            return zero.repeat(lz)
        }

        // let bufToInt handle the rest
        const rem = u8.subarray(lz)
        let val = u8ToInt(rem)

        // extract base-N digits LSB→MSB
        const digits: string[] = []
        while(val > 0n) {
            const idx = Number(val % BASE)
            digits.push(A[idx])
            val /= BASE
        }

        // assemble output in one array
        const outLen = lz + digits.length
        const out = new Array<string>(outLen)
        for(let i = 0; i < lz; ++i) out[i] = zero
        for(let i = 0, d = digits.length; i < d; ++i) {
            out[lz + i] = digits[d - 1 - i]
        }

        return out.join("")
    }
}
