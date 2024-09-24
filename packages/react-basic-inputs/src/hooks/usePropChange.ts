import {useRef} from 'react'
import {sameValueZero} from '../util/compare.ts'


export function usePropChange<T>(prop: T, callback: () => void) {
    const ref = useRef<T>(prop)
    if(!sameValueZero(ref.current,prop)) {
        callback()
        ref.current = prop
    }
}


// export function usePropStateValue<T,V>(prop: T, transform: (prop: T) => V) {
//     const [value,setValue]
// }
