import {Resolvable, resolveValue} from './resolvable'


export function fpShallowMerge<T>(...objects: {
    [K in keyof T]?: Resolvable<T[K], [T[K], K]>;
}[]): (obj: T) => T & {} {
    return (obj: T) => {
        const ret = Object.assign(Object.create(null), obj)
        for(const o of objects) {
            for(const k of Object.keys(o) as (keyof T)[]) {
                ret[k] = resolveValue(o[k], ret[k], k)
            }
        }
        return ret
    }
}
