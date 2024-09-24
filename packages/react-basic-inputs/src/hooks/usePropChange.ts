import {useCallback, useEffect, useRef} from 'react'
import {useLatest} from './useLatest.ts'

export function usePropChange<T>(prop: T, callback: () => void) {
    const ref = useRef<T>(prop)
    const cb = useLatest(callback)

    useEffect(() => {
        if(!Object.is(ref.current, prop)) {
            cb.current()
            ref.current = prop
        }
    }, [cb, prop])

    return useCallback((newValue: T) => {
        ref.current = newValue
    }, [])
}
