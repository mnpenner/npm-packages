function jsonReplacer(this: any, key: string, value: any): any {
    if(value instanceof Set) {
        return Array.from(value)
    }
    if(value instanceof Map) {
        return Object.fromEntries(value)
    }
    return value
}


export function jsonStringify(obj: any, space?: string | number): string {
    return JSON.stringify(obj, jsonReplacer, space)
}

export function varDump(x: any) {
    if(x === undefined) return '(undefined)'
    return jsonStringify(x, 2)
}

export function logJson(...vars: any) {
    console.log(...vars.map((x: any) => varDump(x)))
}
