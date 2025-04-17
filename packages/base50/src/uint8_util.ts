import {getRandomValues, randomInt} from 'crypto'

export function uint8ArrayToBase64(arr: Uint8Array): string {
    return btoa(String.fromCharCode(...arr))
}

export function uint8ArrayToHex(arr: Uint8Array): string {
    return [...arr].map(b => b.toString(16).padStart(2, '0')).join('')
}

export function randomUint8Array(minLen: number, maxLen: number): Uint8Array {
    return getRandomValues(new Uint8Array(randomInt(minLen, maxLen + 1)))
}

export function u8(...args: Array<number | number[]>): Uint8Array {
    return new Uint8Array(args.flat(1))
}
