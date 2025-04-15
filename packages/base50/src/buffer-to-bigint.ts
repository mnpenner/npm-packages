const SUPPORTS_BUFFER = typeof Buffer !== 'undefined' && typeof Buffer.isBuffer === 'function'
const SUPPORTS_DATAVIEW = typeof DataView !== 'undefined' && typeof ArrayBuffer !== 'undefined'


/**
 * Encodes an array-like sequence of numbers into a single big-endian integer.
 *
 * Meaning the first byte (left-most; index 0) is the most significant ("biggest") value.
 *
 * @param {ArrayLike<number>} buffer - The input sequence of numbers to be encoded. Each element represents a byte.
 * @return {bigint} The resulting integer encoded in big-endian format.
 */
export function beBufToBigInt(buffer: ArrayLike<number>): bigint {
    if(buffer.length <= 1) {
        if(buffer.length === 0) {
            return 0n
        }
        return BigInt(buffer[0])
    }
    if(buffer.length <= 8) {
        // TODO: pre-check the support and modify the function itself (pull out of class)
        if(SUPPORTS_BUFFER && Buffer.isBuffer(buffer)) {
            if(buffer.length === 8) {
                return buffer.readBigInt64BE()
            }
            if(buffer.length <= 6) {
                return BigInt(buffer.readUIntBE(0, buffer.length))
            }
            const high = BigInt(buffer.readUIntBE(0, 6)) << 8n
            const low = BigInt(buffer[6])
            return high | low
        }
        if(SUPPORTS_DATAVIEW && (buffer as Uint8Array).buffer instanceof ArrayBuffer) {
            // TODO: support ArrayBuffer directly
            // TODO: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DataView/getBigUint64 defaults to BE
        }
        // TODO: is it worth converting integer array to UInt8Array so we can use the methods?
    }
    let result = 0n
    for(let i = 0; i < buffer.length; ++i) {
        result = (result << 8n) | BigInt(buffer[i])
    }
    return result
}

/**
 * Encodes an array-like sequence of numbers into a single big-endian integer.
 *
 * The input buffer can be any number of bytes. It assumed to be unsigned.
 *
 * @param {ArrayLike<number>} buffer - The input sequence of numbers to be encoded. Each element represents a byte.
 * @return {bigint} The resulting integer encoded in big-endian format.
 */
export function leBufToInt(buffer: ArrayLike<number>): bigint {
    if(SUPPORTS_BUFFER && Buffer.isBuffer(buffer) && buffer.length <= 6) {
        return BigInt(buffer.readUIntLE(0, buffer.length))
    }
    let result = 0n
    for(let i = buffer.length - 1; i >= 0; --i) {
        result = (result << 8n) | BigInt(buffer[i])
    }
    return result
}
