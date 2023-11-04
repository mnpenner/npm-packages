import {isIterable} from '@mnpenner/is-type'


export function mapIter<In, Out>(iterable: Iterable<In>, cb: (el: In, i: number) => Out): Out[] {
    const out = []
    let i = 0
    for(const x of iterable) {
        out.push(cb(x, i++))
    }
    return out
}

export function getStringTag(value: any): string {
    // https://github.com/lodash/lodash/blob/2da024c3b4f9947a48517639de7560457cd4ec6c/.internal/getTag.js
    if(value == null) {
        return value === undefined ? 'Undefined' : 'Null'
    }
    return Object.prototype.toString.call(value).slice(8, -1)
}

export function isEmpty(children: any): boolean {
    return children == null || (Array.isArray(children) && children.length === 0)
}

export function fullWide(n: number): string {
    try {
        return n.toLocaleString('en-US', {useGrouping: false, maximumFractionDigits: 20})
    } catch {
        return n.toFixed(14).replace(/\.?0+$/, '')
    }
}


export function flattenString(content: string | Iterable<string>, sep = '') {
    return isIterable(content) ? Array.from(content).join(sep) : content
}
