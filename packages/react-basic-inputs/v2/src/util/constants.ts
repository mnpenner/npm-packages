import {AnyFn, NonNil} from "../types/utility";

export const EMPTY_OBJECT: Readonly<NonNil> = Object.freeze({__proto__: null})
export const EMPTY_ARRAY: ReadonlyArray<any> = Object.freeze([])
export const NOOP: AnyFn = Object.freeze(() => {/*noop*/
})

export function identity<T>(x: T): T {
    return x
}
