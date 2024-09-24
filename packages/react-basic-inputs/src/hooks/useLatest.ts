// https://github.com/streamich/react-use/blob/e1d0cd9f7fb2a124a9d46879489abfefdf48d836/src/useLatest.ts
import {useRef} from 'react'


export function useLatest<T>(value: T): { readonly current: T } {
    const ref = useRef(value)
    ref.current = value
    return ref
}
