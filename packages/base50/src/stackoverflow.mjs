// https://stackoverflow.com/a/79584974/65387

class ChunkedBufferEncoder {
    constructor(alphabet, bytesPerChunk) {
        if (alphabet.length < 2 || alphabet.length > 256) {
            throw `length of alphabet must in [2, 256]`;
        }
        this.alphabet = alphabet;
        this.reverse = new Map(Array.from(this.alphabet).map((c, i) => [c, i]));
        this.bytesPerChunk = bytesPerChunk;
        this.base = this.alphabet.length;
        this.coef = 8 / Math.log2(this.base);
        this.charsPerChunk = this._getNumOfChars(this.bytesPerChunk);
    }

    _getNumOfChars(nBytes) {
        return Math.ceil(nBytes * this.coef);
    }

    _getBigInt(data, start, end) {
        let val = 0n;
        for (let i = start; i < end; ++i) {
            val = val << 8n | BigInt(data[i]);
        }
        return val;
    }

    /**
     * @param {BigInt} val
     * @param {number} nChars
     * @returns {string}
     */
    _encodToChars(val, nChars) {
        let str = '';
        let base = BigInt(this.base);
        for (let i = 0; i < nChars; ++i) {
            str = this.alphabet[val % base] + str;
            val = val / base;
        }
        return str;
    }

    /**
     * @param {Uint8Array} data
     */
    encode(data) {
        let result = '';
        let i;
        for (i = 0; i + this.bytesPerChunk <= data.length; i += this.bytesPerChunk) {
            let val = this._getBigInt(data, i, i + this.bytesPerChunk);
            result += this._encodToChars(val, this.charsPerChunk);
        }
        let remNumBytes = data.length - i;
        let remNumChars = this._getNumOfChars(remNumBytes);
        let val = this._getBigInt(data, i, i + remNumBytes);
        result += this._encodToChars(val, remNumChars);
        return result;
    }

    _decodeToBigInt(code, start, end) {
        let val = 0n;
        let base = BigInt(this.base);
        for (let i = start; i < end; ++i) {
            val = val * base + BigInt(this.reverse.get(code[i]));
        }
        return val;
    }

    _writeValueToData(data, start, end, val) {
        for (let i = end - 1; i >= start; --i) {
            data[i] = Number(val & 0xffn);
            val >>= 8n;
        }
    }

    decode(code) {
        let numBytes = Math.floor(code.length / this.coef);
        let data = new Uint8Array(numBytes);
        let i, k = 0;
        for (i = 0; i + this.charsPerChunk <= code.length; i += this.charsPerChunk) {
            let val = this._decodeToBigInt(code, i, i + this.charsPerChunk);
            this._writeValueToData(data, k, k + this.bytesPerChunk, val);
            k += this.bytesPerChunk;
        }
        let remNumChars = code.length - i;
        let remNumBytes = Math.floor(remNumChars / this.coef);
        let val = this._decodeToBigInt(code, i, i + remNumChars);
        this._writeValueToData(data, k, k + remNumBytes, val);
        return data;
    }
}


// ---------- TEST ----------

function randomUint8Array(minLen, maxLen) {
    return crypto.getRandomValues(new Uint8Array(Math.floor(Math.random() * (maxLen - minLen + 1)) + minLen))
}


const base64encoder = new ChunkedBufferEncoder('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/',3)
const base3encoder = new ChunkedBufferEncoder('012', 12, 61)

const NUM_TESTS = 10000
const MIN_BYTES = 1
const MAX_BYTES = 17

function arrEq(a, b) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return false;
    }
    return true;
}

function uint8ArrayToHex(arr) {
    return Array.from(arr, b => b.toString(16).toUpperCase().padStart(2, '0')).join(' ')
}


for(const encoder of [base64encoder,base3encoder]) {
    for(let i = 0; i < NUM_TESTS; i++) {
        const buf = randomUint8Array(MIN_BYTES, MAX_BYTES)
        const encoded = encoder.encode(buf)
        const decoded = encoder.decode(encoded)
        console.log(buf,encoded,decoded)
        if(!arrEq(buf, decoded)) throw new Error(
            `Buf: ${uint8ArrayToHex(buf)} Encoded: ${encoded} Decoded: ${uint8ArrayToHex(decoded)}`
        )
    }
}

console.log('PASS!')
