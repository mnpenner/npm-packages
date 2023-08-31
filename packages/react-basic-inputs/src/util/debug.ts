export function logJson(...args: any[]) {
    // TODO: add color: https://developer.mozilla.org/en-US/docs/Web/API/console#Usage
    console.log('%c%s'.repeat(args.length), ...args.flatMap(a => [`background-color:#1D1D26;color:${type2color(a)};border:1px dashed #eee;padding:1px 2px;`, JSON.stringify(a, null, 2)]))
}

function type2color(x: any) {
    if (typeof x === 'string') {
        return '#61A257'
    }
    if (typeof x === 'boolean') {
        return '#396CDE'
    }
    return '#C8C8B7'
}
