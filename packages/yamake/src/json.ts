function jsonReplacer(this: any, key: string, value: any): any {
    if(value instanceof Set) {
        return Array.from(value)
    }
    if(value instanceof Map) {
        return Object.fromEntries(value.entries())
    }
    return value
}

export function jsonStringify(obj: any, space?: string | number): string {
    return JSON.stringify(obj, jsonReplacer, space)
}

function varDump(x: any) {
    if(x === undefined) return '(undefined)'
    return jsonStringify(x, 2)
}

export function logJson(...args: any[]) {
    console.log(args.map(a => varDump(a)).join("\n---\n"))
}
