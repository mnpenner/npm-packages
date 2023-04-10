export const EMPTY_OBJECT: Readonly<{}> = Object.freeze({__proto__: null})
export const EMPTY_ARRAY: ReadonlyArray<any> = Object.freeze([])
export const NOOP: AnyFn = Object.freeze(() => {
})

export function identity<T>(x: any): any {
    return x
}
