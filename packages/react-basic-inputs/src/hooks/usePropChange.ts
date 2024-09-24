import {useEffect, useRef} from 'react'
import {sameValueZero} from '../util/compare.ts'
import {useLatest} from './useLatest.ts'

export function usePropChange<T>(prop: T, callback: () => void) {
    const ref = useRef<T>(prop)
    const cb = useLatest(callback)

    useEffect(() => {
        if(!sameValueZero(ref.current, prop)) {
            cb.current()
            ref.current = prop
        }
    }, [cb, prop])
}
