export function logJson(...args: any[]) {
    console.log(...args.map(a => JSON.stringify(a, null, 2)))
}
