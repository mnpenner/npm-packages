export function toHex(buf: Buffer): string {
    return buf.toString('hex')
}

export function toBase64Url(buf: Buffer): string {
    return buf.toString('base64url')
}

export function fromBase64Url(buf: string): Buffer {
    return Buffer.from(buf, 'base64url')
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
