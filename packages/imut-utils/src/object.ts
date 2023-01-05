import type {ValueOf} from './types'
import {Resolvable, resolveValue} from './resolvable'


export function fpShallowMerge<T>(...objects: {
    [P in keyof T]?: Resolvable<ValueOf<T>,[ValueOf<T>,keyof T]>;
}[]): (obj:T)=>T&{} {
    return (obj: T) => {
        const ret = Object.assign(Object.create(null), obj)
        for(const o of objects) {
            for(const k of Object.keys(o) as (keyof T)[]) {
                ret[k] = resolveValue(o[k],ret[k],k)
            }
        }
        return ret
    }
}
