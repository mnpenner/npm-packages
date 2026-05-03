import { useState } from 'react'

export function usePropState<T>(prop: T, _onChange?: (value: T) => void) {
    const [value, setValue] = useState(prop)
    const [prevProp, setPrevProp] = useState(prop)

    if (prop !== prevProp) {
        setPrevProp(prop)
        setValue(prop)
    }

    return [value, setValue] as const
}
