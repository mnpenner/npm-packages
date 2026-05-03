import type { DependencyList } from 'react'
import { useLayoutEffect, useRef, useState } from 'react'

import { useLatest } from './useLatest.ts'
import { shallowArrayEqual } from '../util/collections.ts'

export function useOnce(callback: () => void) {
    useState(() => {
        callback()
    })
}

export function useOnceEffect(callback: () => void) {
    const first = useRef(true)
    const cb = useLatest(callback)
    useLayoutEffect(() => {
        if (first.current) {
            first.current = false
            cb.current()
        }
    }, [cb])
}

export function useLayoutEffectCounter(callback: (count: number) => void, deps?: DependencyList) {
    const counter = useRef(0)
    const cb = useLatest(callback)
    const prevDeps = useRef<DependencyList | undefined>(undefined)
    useLayoutEffect(() => {
        const shouldRun =
            deps == null || prevDeps.current == null || !shallowArrayEqual(prevDeps.current, deps)
        if (shouldRun) {
            cb.current?.(counter.current++)
            prevDeps.current = deps
        }
    })
}

export function useFirstLayoutEffect(callback: (isFirst: boolean) => void, deps?: DependencyList) {
    const first = useRef(true)
    const cb = useLatest(callback)

    const prevDeps = useRef<DependencyList | undefined>(undefined)
    useLayoutEffect(() => {
        const shouldRun =
            deps == null || prevDeps.current == null || !shallowArrayEqual(prevDeps.current, deps)
        if (shouldRun) {
            cb.current?.(first.current)
            first.current = false
            prevDeps.current = deps
        }
    })
}

export function useFastChange(callback: () => void, deps: DependencyList) {
    const [prev, setPrev] = useState(deps)
    if (!shallowArrayEqual(prev, deps)) {
        setPrev(deps)
        callback()
    }
}

export function useFastChangeFirst(callback: (isFirst: boolean) => void, deps: DependencyList) {
    const [prev, setPrev] = useState(deps)
    const [first, setFirst] = useState(true)
    if (first) {
        callback(true)
        setFirst(false)
    } else if (!shallowArrayEqual(prev, deps)) {
        setPrev(deps)
        callback(false)
    }
}

export function useFirstRest(callback: (isFirst: boolean) => void) {
    const [first, setFirst] = useState(true)
    if (first) {
        callback(true)
        setFirst(false)
    } else {
        callback(false)
    }
}
