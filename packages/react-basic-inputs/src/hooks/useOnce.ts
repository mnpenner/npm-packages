import {DependencyList, useEffect, useLayoutEffect, useRef, useState} from 'react'
import {useBox} from './useBox.ts'


export function useOnce(callback: () => void) {
    const first = useRef(true)
    if(first.current) {
        first.current = false
        callback()
    }
}

export function useOnceEffect(callback: () => void) {
    const first = useRef(true)
    useLayoutEffect(() => {
        if(first.current) {
            first.current = false
            callback()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
}

export function useLayoutEffectCounter(callback: (count: number) => void, deps?: DependencyList) {
    const counter = useRef(0)
    const cb = useBox(callback)
    useLayoutEffect(() => {
        cb.current?.(counter.current++)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps)
}


