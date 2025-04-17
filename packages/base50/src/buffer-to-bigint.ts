const SUPPORTS_BUFFER = typeof Buffer !== 'undefined' && typeof Buffer.isBuffer === 'function'
const SUPPORTS_DATAVIEW = typeof DataView !== 'undefined' && typeof ArrayBuffer !== 'undefined'


function getView(buffer: ArrayLike<number>): DataView {
    if(ArrayBuffer.isView(buffer)) {  // UInt8Array or Node Buffer
        return new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength)
    }
    if(buffer instanceof ArrayBuffer) {
        return new DataView(buffer, buffer.byteLength, buffer.byteLength)
    }
    return new DataView(Uint8Array.from(buffer).buffer)
}

/**
 * Reads an unsigned big-endian encoded buffer into a bigint.
 *
 * Meaning the first byte (left-most; index 0) is the most significant ("biggest") value.
 *
 * Optimized for Node Buffers and UInt8Arrays <= 8 bytes, but supports unbounded arrays.
 *
 * @param {ArrayLike<number>} buffer Input bytes. Each element must be in the range [0-255].
 * @return {bigint}
 */
export function bufToInt(buffer: ArrayLike<number>): bigint {
    if(buffer.length <= 1) {
        if(buffer.length === 0) {
            return 0n
        }
        return BigInt(buffer[0])
    }
    if(buffer.length >= 8) {
        let i = 0
        let result = 0n
        const view = getView(buffer)
        const end = buffer.length - 8
        for(; ;) {
            result |= BigInt(view.getBigUint64(i, false))
            i += 8
            if(i >= end) {
                break
            }
            result <<= 64n
        }
        for(; i < buffer.length; ++i) {
            result = (result << 8n) | BigInt(buffer[i])
        }
        return result
    }
    let result = BigInt(buffer[0])
    for(let i = 1; i < buffer.length; ++i) {
        result = (result << 8n) | BigInt(buffer[i])
    }
    return result
}

/**
 * Reads an unsigned little-endian encoded buffer into a bigint.
 *
 * Meaning the first byte (left-most; index 0) is the least significant ("smallest") value.
 *
 * Optimized for Node Buffers and UInt8Arrays <= 8 bytes, but supports unbounded arrays.
 *
 * @param {ArrayLike<number>} buffer Input bytes. Each element must be in the range [0-255].
 * @return {bigint}
 */
export function leBufToBigInt(buffer: ArrayLike<number>): bigint {
    if(buffer.length <= 1) {
        if(buffer.length === 0) {
            return 0n
        }
        return BigInt(buffer[0])
    }
    if(buffer.length <= 8) {
        if(SUPPORTS_BUFFER && Buffer.isBuffer(buffer)) {
            if(buffer.length === 8) {
                return buffer.readBigUInt64LE()
            }
            if(buffer.length <= 6) {
                return BigInt(buffer.readUIntLE(0, buffer.length))
            }
            // 7 bytes
            return BigInt(buffer.readUIntLE(0, 6)) | (BigInt(buffer[6]) << 48n)
        }
        if(ArrayBuffer.isView(buffer)) {
            const dv = new DataView(buffer.buffer)
            if(buffer.length === 8) {
                return dv.getBigUint64(0, true)
            }
            if(buffer.length === 4) {
                return BigInt(dv.getUint32(0, true))
            }
            if(buffer.length === 2) {
                return BigInt(dv.getUint16(0, true))
            }
            if(buffer.length === 6) {
                return BigInt(dv.getUint32(0, true)) | (BigInt(dv.getUint16(4, true)) << 32n)
            }
            const lastByte = BigInt(buffer[buffer.length - 1])
            if(buffer.length === 7) {
                return BigInt(dv.getUint32(0, true))
                    | (BigInt(dv.getUint16(4, true)) << 32n)
                    | (lastByte << 48n)
            }
            if(buffer.length === 5) {
                return BigInt(dv.getUint32(0, true))
                    | (lastByte << 32n)
            }
            if(buffer.length === 3) {
                return BigInt(dv.getUint16(0, true))
                    | (lastByte << 16n)
            }
        }
    }
    let result = BigInt(buffer[buffer.length - 1])
    for(let i = buffer.length - 2; i >= 0; --i) {
        result = (result << 8n) | BigInt(buffer[i])
    }
    return result
}
