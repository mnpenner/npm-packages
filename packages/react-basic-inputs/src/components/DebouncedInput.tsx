import {OverrideProps} from '../types/utility.ts'
import {useEffect, useInsertionEffect, useLayoutEffect, useRef, useState, memo} from 'react'
import {useBox} from '../hooks/useBox.ts'
import {useUpdateEffect} from 'react-use'
import {usePropState} from '../hooks/usePropState.ts'

export type DebouncedInputChangeEvent = {
    value: string
}

export type DebouncedInputProps = OverrideProps<'input', {
    value: string
    onChange: (ev: DebouncedInputChangeEvent) => void
    debounce?: number
}>

type Timer = ReturnType<typeof setTimeout>

export const DebouncedInput = memo(({
    value: initialValue,
    onChange,
    debounce = 500,
    ...props
}: DebouncedInputProps) => {
    const timerRef = useRef<Timer | undefined>(undefined)
    const [value, setValue] = usePropState(initialValue, () => {
        console.log('usePropState callback')
        // clearTimeout(timerRef.current)
    })
    const onChangeRef = useBox(onChange)
    const debounceRef = useBox(debounce)


    return (
        <input {...props} value={value} onChange={ev => {
            const value = ev.target.value
            clearTimeout(timerRef.current)
            console.log('onChange setValue')
            setValue(value)
            timerRef.current = setTimeout(() => {
                console.log('debounced onChange')
                onChangeRef.current({value})
            }, debounceRef.current)
        }} />
    )
})
