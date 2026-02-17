import {useDebugValue, useInsertionEffect, useRef} from 'react'
import {NOOP} from '../util/constants'
import type {AnyFn, EventCallback} from "../types/utility"

/**
 * @see https://github.com/reactjs/rfcs/blob/useevent/text/0000-useevent.md
 */
export let useEventHandler: <TCallback extends AnyFn>(callback: TCallback) => TCallback

if(typeof window !== 'undefined') {
    useEventHandler = <TCallback extends AnyFn>(callback: TCallback) => {
        useDebugValue(callback)

        const latestRef = useRef<TCallback>(useEvent_shouldNotBeInvokedBeforeMount as any)
        useInsertionEffect(() => {
            latestRef.current = callback
        }, [callback])

        // Create a stable callback that always calls the latest callback:
        // using useRef instead of useCallback avoids creating and empty array on every render
        const stableRef = useRef<TCallback>(null as any)
        if(!stableRef.current) {
            stableRef.current = function(this: any) {
                return latestRef.current.apply(this, arguments as any)
            } as TCallback
        }

        return stableRef.current
    }
} else {
    useEventHandler = NOOP
}


export default function useEvent<T>(handler: EventCallback<T>) {
    return useEventHandler(handler);
}
/**
 * Render methods should be pure, especially when concurrency is used,
 * so we will throw this error if the callback is called while rendering.
 */
function useEvent_shouldNotBeInvokedBeforeMount() {
    throw new Error("INVALID_USE_EVENT_INVOCATION: the callback from useEvent cannot be invoked before the component has mounted.")
}
