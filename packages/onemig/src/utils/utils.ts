export function toBool(str: string) {
    if (str === 'Y') return true
    if (str === 'N') return false
    return null
}

export function fromBool(bool: boolean) {
    return bool ? "'Y'" : "'N'"
}


export function groupBy<V, K extends keyof V>(arr: V[], key: K): Map<V[K], V[]>
export function groupBy<V, K = any>(arr: V[], fn: ((x: V) => K)): Map<K, V[]>
export function groupBy<V, K>(arr: V[], fn: any) {
    const out = new Map<K, V[]>()
    if (typeof fn !== 'function') {
        const k: keyof V = fn
        fn = (x: V) => x[k]
    }
    for (const x of arr) {
        const key = fn(x)
        const a = out.get(key)
        if (a) {
            a.push(x)
        } else {
            out.set(key, [x])
        }
    }
    return out
}
