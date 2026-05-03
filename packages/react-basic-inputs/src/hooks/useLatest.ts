import { useLayoutEffect, useRef } from 'react'

/**
 * "Box" a value inside an object ("ref") and keep it up to date.
 * This way the ref is stable, but the value is always current.
 * Useful for avoiding unnecessary churn in `useEffect`.
 *
 * @example
 * ```ts
 * const cb = useLatest(callback)
 * useEffect(() => {
 *   cb.current()
 * }, [cb])
 * ```
 *
 * @param value - The value to store in the ref.
 * @returns A ref object containing the latest value.
 */
export function useLatest<T>(value: T): { readonly current: T } {
    const ref = useRef(value)
    useLayoutEffect(() => {
        ref.current = value
    }, [value])
    return ref
}
