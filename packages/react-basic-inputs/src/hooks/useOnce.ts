import type {DependencyList} from 'react';
import { useLayoutEffect, useRef} from 'react'
import {useBox} from './useBox.ts'
import {shallowArrayEqual} from '../util/collections.ts'


export function useOnce(callback: () => void) {
    const first = useRef(true)
    if(first.current) {
        first.current = false
        callback()
    }
}

export function useOnceEffect(callback: () => void) {
    const first = useRef(true)
    const cb = useBox(callback)
    useLayoutEffect(() => {
        if(first.current) {
            first.current = false
            cb.current()
        }
    }, [cb])
}

export function useLayoutEffectCounter(callback: (count: number) => void, deps?: DependencyList) {
    const counter = useRef(0)
    const cb = useBox(callback)
    const prevDeps = useRef<DependencyList | undefined>(undefined)
    useLayoutEffect(() => {
        const shouldRun = deps == null || prevDeps.current == null || !shallowArrayEqual(prevDeps.current, deps)
        if(shouldRun) {
            cb.current?.(counter.current++)
            prevDeps.current = deps
        }
    })
}


export function useFirstLayoutEffect(callback: (isFirst: boolean) => void, deps?: DependencyList) {
    const first = useRef(true)
    const cb = useBox(callback)
    const prevDeps = useRef<DependencyList | undefined>(undefined)
    useLayoutEffect(() => {
        const shouldRun = deps == null || prevDeps.current == null || !shallowArrayEqual(prevDeps.current, deps)
        if(shouldRun) {
            cb.current?.(first.current)
            first.current = false
            prevDeps.current = deps
        }
    })
}


export function useFastChange(callback: () => void, deps: DependencyList) {
    const prev = useRef(deps)
    if(!shallowArrayEqual(prev.current, deps)) {
        callback()
        prev.current = deps
    }
}

export function useFastChangeFirst(callback: (isFirst: boolean) => void, deps: DependencyList) {
    const prev = useRef(deps)
    const first = useRef(true)
    if(first.current) {
        callback(true)
        first.current = false
    } else if(!shallowArrayEqual(prev.current, deps)) {
        callback(false)
    }
    prev.current = deps
}

export function useFirstRest(callback: (isFirst: boolean) => void) {
    const first = useRef(true)
    if(first.current) {
        callback(true)
        first.current = false
    } else {
        callback(false)
    }
}
