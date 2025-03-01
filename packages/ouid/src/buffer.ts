export function toHex(array: Uint8Array): string {
    return Array.from(array)
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join('')
}

export function toBase64Url(array: Uint8Array): string {
    return btoa(String.fromCharCode(...array))
        .replace(/={1,2}$/, '')
        .replace(/[+/]/g, m => m === '+' ? '-' : '_')
}

export function fromBase64Url(base64url: string): Uint8Array {
    const base64 = base64url
        .replace(/[-_]/g, m => m === '-' ? '+' : '/');

    return new Uint8Array(atob(base64)
        .split('')
        .map((c) => c.charCodeAt(0)));
}
