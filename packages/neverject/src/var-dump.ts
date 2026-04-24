type NumericTypedArray =
    Int8Array | Uint8Array | Uint8ClampedArray |
    Int16Array | Uint16Array |
    Int32Array | Uint32Array |
    Float32Array | Float64Array

type BigIntTypedArray = BigInt64Array | BigUint64Array

function isNumericTypedArray(view: ArrayBufferView): view is NumericTypedArray {
    return view instanceof Int8Array ||
        view instanceof Uint8Array ||
        view instanceof Uint8ClampedArray ||
        view instanceof Int16Array ||
        view instanceof Uint16Array ||
        view instanceof Int32Array ||
        view instanceof Uint32Array ||
        view instanceof Float32Array ||
        view instanceof Float64Array
}

function isBigIntTypedArray(view: ArrayBufferView): view is BigIntTypedArray {
    return view instanceof BigInt64Array || view instanceof BigUint64Array
}

function hasCustomToString(value: object): value is { toString(): string } {
    const toString = (value as { toString?: unknown }).toString
    if (typeof toString !== 'function') return false

    return toString !== Object.prototype.toString &&
        toString !== Array.prototype.toString
}

export function varDump(payload: unknown): string {
    // Error
    if (payload instanceof Error) return payload.toString()

    // undefined
    if (payload === undefined) return 'undefined'

    // string (use JSON.stringify for safe escaping)
    if (typeof payload === 'string') return JSON.stringify(payload)

    // bigint
    if (typeof payload === 'bigint') return `${payload}n`

    // Date
    if (payload instanceof Date) return `Date(${payload.toISOString()})`

    // RegExp
    if (payload instanceof RegExp) return payload.toString()

    // Map
    if (payload instanceof Map) {
        const entries = Array.from(payload.entries()).map(
            ([k, v]) => `${varDump(k)}=>${varDump(v)}`
        )
        return `Map{${entries.join(',')}}`
    }

    // Set
    if (payload instanceof Set) {
        return `Set{${Array.from(payload, varDump).join(',')}}`
    }

    // WeakMap / WeakSet => not serializable
    if (payload instanceof WeakMap) return 'WeakMap{…}'
    if (payload instanceof WeakSet) return 'WeakSet{…}'

    // ArrayBuffer
    if (payload instanceof ArrayBuffer) {
        return `ArrayBuffer(${payload.byteLength})`
    }

    // DataView
    if (payload instanceof DataView) {
        return `DataView(${payload.byteLength})`
    }

    // Typed arrays
    if (ArrayBuffer.isView(payload) && isNumericTypedArray(payload)) {
        return `${payload.constructor.name}[${Array.from(payload).join(',')}]`
    }
    if (ArrayBuffer.isView(payload) && isBigIntTypedArray(payload)) {
        const values = Array.from(payload, (v) => `${v}n`)
        return `${payload.constructor.name}[${values.join(',')}]`
    }

    // JSON-able objects
    if (typeof payload === 'object' && payload !== null) {
        if (hasCustomToString(payload)) {
            try {
                return payload.toString()
            } catch { /* ignore */ }
        }

        if (Array.isArray(payload)) {
            const values = payload.map(varDump)
            return `[${values.join(',')}]`
        }

        const proto = Object.getPrototypeOf(payload)
        if (proto === Object.prototype || proto === null) {
            const entries = Object.entries(payload).map(
                ([key, value]) => `${JSON.stringify(key)}:${varDump(value)}`
            )
            return `{${entries.join(',')}}`
        }

        try {
            const json = JSON.stringify(payload)
            if (json !== undefined) return json
        } catch { /* ignore */ }
    }

    // final fallback
    try { return String(payload) }
    catch { return '[unstringifiable]' }
}
