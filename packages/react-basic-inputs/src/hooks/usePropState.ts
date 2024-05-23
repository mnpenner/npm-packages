import {DependencyList, useCallback, useReducer, useRef, useState} from 'react'
import {useUpdateEffect} from 'react-use'


export function usePropState<T>(prop: T, onChange?: () => void) {

    const [, forceUpdate] = useReducer(() => Symbol(), Symbol());

    // const [value, setValue] = useState(prop)
    // const internalValue = useRef(prop)
    // const setThisIter = useRef(false)
    //
    // const setValueInternal = (v: T) => {
    //     console.log('setValueInternal')
    //     internalValue.current = v
    //     setThisIter.current = true
    //     setValue(v)
    // }

    const valueRef = useRef(prop)
    const delayedRef = useRef(prop)

    console.log('usePropState', prop, valueRef.current, delayedRef.current)

    if(valueRef.current === delayedRef.current && prop !== valueRef.current) {
        console.log('trigger!')
    }

    delayedRef.current = valueRef.current

    const setValueInternal = (v: T) => {
        // setValue(v)  // this triggers a re-render
        forceUpdate()
        valueRef.current = v
    }

    // if(prop === delayedRef.current && prop !== valueRef.current) {
    //     onChange?.()
    //     // valueRef.current = prop
    // }

    //
    // console.log(setThisIter.current,value,prop, internalValue.current)
    //
    // if(!setThisIter.current && prop !== internalValue.current) {
    //     console.log('external change')
    //     setValue(prop)
    //     internalValue.current = prop
    //     setThisIter.current = true
    //     // onChange?.(prop)
    // } else {
    //     setThisIter.current = false
    // }

    // if(prop !== valueRef.current) {

        // setValue(prop)
    // }


    // if(!setThisIter.current && prop !== internalValue.current) {
    //     console.log('prop changed',value,prop, internalValue.current)
    //     setValueInternal(prop)
    //     onChange?.(prop)
    //     setThisIter.current = false
    // } else {
    //     console.log('skipped',value,prop, internalValue.current)
    // }



    return [
        valueRef.current,
        setValueInternal
    ] as const
}


function useFastEffect(callback: () => void, value: unknown) {
    const ref = useRef(value)
    if(value !== ref.current) {
        callback()
        ref.current = value
    }
}
