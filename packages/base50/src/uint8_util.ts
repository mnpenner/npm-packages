import {getRandomValues, randomInt} from 'crypto'

export function uint8ArrayToBase64(arr: Uint8Array): string {
    return btoa(String.fromCharCode(...arr))
}

export function uint8ArrayToHex(arr: Uint8Array): string {
    return Array.from(arr, b => b.toString(16).toUpperCase().padStart(2, '0')).join(' ')
}

export function randomUint8Array(minLen: number, maxLen: number): Uint8Array {
    return getRandomValues(new Uint8Array(randomInt(minLen, maxLen + 1)))
}

export function u8(str: string): Uint8Array
export function u8(arr: number[]): Uint8Array
export function u8(...values: number[]): Uint8Array
export function u8(...args: any[]): Uint8Array {
    if(args.length === 1) {
        if(typeof args[0] === 'string') {
            return new TextEncoder().encode(args[0])
        }
        if(Array.isArray(args[0])) {
            return new Uint8Array(args[0])
        }
    }
    return new Uint8Array(args as number[])
}
