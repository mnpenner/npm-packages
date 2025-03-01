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

export function base36ToBigInt(str: string): bigint {
    let value = 0n
    const base = 36n
    for(let char of str) {
        const digit = parseInt(char, 36)
        value = value * base + BigInt(digit)
    }
    return value
}

export function shuffleArray<T>(a: T[]): T[] {
    const randomBuffer = new Uint32Array(1);
    for (let i = a.length - 1; i > 0; i--) {
        crypto.getRandomValues(randomBuffer);
        const randomIndex = Math.floor(randomBuffer[0] / 4294967296 * (i + 1));
        [a[i], a[randomIndex]] = [a[randomIndex], a[i]];
    }
    return a;
}

export function shuffleString(s: string): string {
    const chars = [...s];
    shuffleArray(chars);
    return chars.join('');
}
