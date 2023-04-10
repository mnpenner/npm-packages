import {useCallback} from 'react'

export type Callback = () => void

export function useRefEffect<T extends Element>(callback: (el: T) => (Callback | void)) {
    let cb: Callback | void
    return useCallback((el: T) => {
        if(el) {
            // eslint-disable-next-line react-hooks/exhaustive-deps
            cb = callback(el)  // https://stackoverflow.com/q/75431907/65387
        } else if(cb) {
            cb()
        }
    }, [])
}
