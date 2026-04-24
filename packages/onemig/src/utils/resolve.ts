import * as Lo from 'lodash'

export type Resolvable<T=any, TArgs extends ReadonlyArray<any>=[]> = T | ((...args: TArgs) => T)

export function resolveValue<T, TArgs extends ReadonlyArray<any>>(val: Resolvable<T,TArgs>, ...args: TArgs): T {
    return Lo.isFunction(val) ? val(...args) : val
}
