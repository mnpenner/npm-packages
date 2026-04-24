import {useCallback, useRef} from 'react'

export type Callback = () => void

export function useRefEffect<T extends Element>(callback: (el: T) => (Callback | void)) {
    const callbackRef = useRef(callback)
    const cleanupRef = useRef<Callback | void>(undefined)
    callbackRef.current = callback

    return useCallback((el: T) => {
        if(el) {
            cleanupRef.current = callbackRef.current(el)
        } else if(cleanupRef.current) {
            cleanupRef.current()
            cleanupRef.current = undefined
        }
    }, [])
}
