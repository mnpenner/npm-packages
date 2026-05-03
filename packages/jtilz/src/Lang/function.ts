import { SKIP, filterMap } from '../Col'
import { isFunction } from '@mpen/is-type'
import type { IDictionary } from '../interfaces'

/**
 * Decorates all the functions in a module.
 *
 * @param module - Object containing methods.
 * @param wrapFn - Accepts a function, returns a new function.
 * @returns A new object with wrapped methods.
 */
export function wrapMethods(
    module: IDictionary<any>,
    wrapFn: (fn: (...args: any[]) => any) => (...args: any[]) => any,
): IDictionary<(...args: any[]) => any> {
    return filterMap<any, (...args: any[]) => any>(module, (v) =>
        isFunction(v) ? wrapFn(v) : SKIP,
    )
}
