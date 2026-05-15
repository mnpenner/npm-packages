export function isLocalhost(hostname: string): boolean {
    const lower = hostname.toLowerCase()
    return lower === 'localhost' || lower === '127.0.0.1' || lower === '::1' || lower === '0.0.0.0'
}
