import type {FP, nil} from './types'


export function fpShallowMerge<T>(...objects: Partial<T>[]): (obj:T)=>Exclude<T,nil> {
    return (obj: T) => Object.assign(Object.create(null), obj, ...objects)
}
