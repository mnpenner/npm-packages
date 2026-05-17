type JsonPrimitive = string | number | boolean | null
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue }

const CIRCULAR_VALUE = '[Circular]'

export function jsonAscii(value: unknown): string {
    return JSON.stringify(toJsonValue(value, new WeakSet())).replace(/[^\x00-\x7F]/gu, (c) => {
        const cp = c.codePointAt(0)!

        if (cp <= 0xffff) {
            return '\\u' + cp.toString(16).padStart(4, '0')
        }

        const n = cp - 0x10000
        const hi = 0xd800 + (n >> 10)
        const lo = 0xdc00 + (n & 0x3ff)

        return '\\u' + hi.toString(16).padStart(4, '0') + '\\u' + lo.toString(16).padStart(4, '0')
    })
}

function toJsonValue(value: unknown, seen: WeakSet<object>): JsonValue {
    if (value === null || typeof value === 'string' || typeof value === 'boolean') {
        return value
    }

    if (typeof value === 'number') {
        return value
    }

    if (typeof value === 'bigint') {
        const asNumber = Number(value)

        return Number.isSafeInteger(asNumber) ? asNumber : value.toString()
    }

    if (typeof value === 'undefined') {
        return '[undefined]'
    }

    if (typeof value === 'symbol') {
        return value.toString()
    }

    if (typeof value === 'function') {
        return `[Function${value.name ? `: ${value.name}` : ''}]`
    }

    if (seen.has(value)) {
        return CIRCULAR_VALUE
    }

    seen.add(value)

    try {
        if (Array.isArray(value)) {
            return value.map((item) => toJsonValue(item, seen))
        }

        if (value instanceof Boolean || value instanceof Number || value instanceof String) {
            return toJsonValue(value.valueOf(), seen)
        }

        if (value instanceof Date) {
            return Number.isNaN(value.getTime()) ? '[Invalid Date]' : value.toISOString()
        }

        if (value instanceof RegExp) {
            return value.toString()
        }

        if (value instanceof Error) {
            return errorToJsonValue(value, seen)
        }

        if (value instanceof Set) {
            return Array.from(value, (item) => toJsonValue(item, seen))
        }

        if (value instanceof Map) {
            const result: Record<string, JsonValue> = {}

            for (const [key, item] of value) {
                result[mapKeyToString(key)] = toJsonValue(item, seen)
            }

            return result
        }

        if (ArrayBuffer.isView(value)) {
            return Array.from(new Uint8Array(value.buffer, value.byteOffset, value.byteLength))
        }

        if (value instanceof ArrayBuffer) {
            return Array.from(new Uint8Array(value))
        }

        if (value instanceof WeakMap) {
            return '[WeakMap]'
        }

        if (value instanceof WeakSet) {
            return '[WeakSet]'
        }

        if (value instanceof Promise) {
            return '[Promise]'
        }

        if (value instanceof URL) {
            return value.toString()
        }

        return objectToJsonValue(value, seen)
    } finally {
        seen.delete(value)
    }
}

function errorToJsonValue(error: Error, seen: WeakSet<object>): JsonValue {
    const result = objectToJsonValue(error, seen)

    result.name = error.name
    result.message = error.message
    result.stack = error.stack ?? null

    if ('cause' in error) {
        result.cause = toJsonValue(error.cause, seen)
    }

    if (error instanceof AggregateError) {
        result.errors = Array.from(error.errors, (item) => toJsonValue(item, seen))
    }

    return result
}

function objectToJsonValue(value: object, seen: WeakSet<object>): Record<string, JsonValue> {
    const result: Record<string, JsonValue> = {}

    for (const key of Object.keys(value)) {
        result[key] = toJsonValue((value as Record<string, unknown>)[key], seen)
    }

    for (const symbol of Object.getOwnPropertySymbols(value)) {
        if (Object.prototype.propertyIsEnumerable.call(value, symbol)) {
            result[symbol.toString()] = toJsonValue(
                (value as Record<symbol, unknown>)[symbol],
                seen,
            )
        }
    }

    return result
}

function mapKeyToString(key: unknown): string {
    if (typeof key === 'string') {
        return key
    }

    if (typeof key === 'symbol') {
        return key.toString()
    }

    if (typeof key === 'bigint') {
        return key.toString()
    }

    return String(key)
}

export function jsAsciiString(obj: string) {
    let numDouble = 0
    let numSingle = 0
    for (let i = 0; i < obj.length; i++) {
        if (obj[i] === '"') ++numDouble
        else if (obj[i] === "'") ++numSingle
    }
    const useSingle = numDouble > numSingle
    const quote = useSingle ? "'" : '"'
    const quoteCode = useSingle ? 0x27 : 0x22

    return (
        quote +
        Array.from(obj)
            .map((ch) => {
                const cp = ch.codePointAt(0)!
                switch (cp) {
                    case 0x08:
                        return '\\b'
                    case 0x0c:
                        return '\\f'
                    case 0x0a:
                        return '\\n'
                    case 0x0d:
                        return '\\r'
                    case 0x09:
                        return '\\t'
                    case 0x0b:
                        return '\\v'
                    case quoteCode:
                        return '\\' + ch
                    case 0x5c:
                        return '\\\\'
                }
                if (cp >= 32 && cp <= 126) {
                    return ch
                }
                if (cp <= 0xff) {
                    return '\\x' + cp.toString(16).padStart(2, '0')
                }
                if (cp <= 0xffff) {
                    return '\\u' + cp.toString(16).padStart(4, '0')
                }
                return '\\u{' + cp.toString(16) + '}'
            })
            .join('') +
        quote
    )
}
