import type {MutableRefObject} from 'react';
import { useRef} from 'react'

/**
 * "Box" a value inside an object ("ref") and keep it up to date.
 * This why the box/ref is stable, but the value is always current.
 * Useful for avoiding unnecessary churn in useEffect.
 */
export function useBox<T>(value: T): MutableRefObject<T> {
    const ref = useRef(value)
    ref.current = value
    return ref
}
