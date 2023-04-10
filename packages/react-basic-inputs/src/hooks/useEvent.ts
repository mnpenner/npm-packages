import {useCallback, useDebugValue, useLayoutEffect, useRef} from 'react'
import {NOOP} from '../util/constants'

/**
 * @see https://github.com/reactjs/rfcs/blob/useevent/text/0000-useevent.md
 */
let useEvent: <T>(handler: EventCallback<T>) => (ev: T) => void

if(typeof window !== 'undefined') {
    useEvent = <T>(handler: EventCallback<T>) => {
        useDebugValue(handler)
        const handlerRef = useRef(handler)

        // In a real implementation, this would run before layout effects
        useLayoutEffect(() => {
            handlerRef.current = handler
        }, [handler])

        return useCallback((ev: T) => {
            // In a real implementation, this would throw if called during render
            handlerRef.current(ev)
        }, [])
    }
} else {
    useEvent = NOOP
}

export default useEvent
