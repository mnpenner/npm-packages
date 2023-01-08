import {Resolvable, resolveValue} from './resolvable'
import type {nil} from './types'


export function fpShallowMerge<T>(...objects: Array<{
    [K in keyof T]?: Resolvable<T[K], [T[K], K]>;
}|nil>): (obj: T) => T & {} {
    return (obj: T) => {
        objects = objects.filter(o => o != null)
        if(!objects.length) {
            return obj
        }
        const ret = Object.assign(Object.create(null), obj)
        for(const o of objects) {
            for(const k of Object.keys(o!) as (keyof T)[]) {
                ret[k] = resolveValue(o![k], ret[k], k)
            }
        }
        return ret
    }
}
