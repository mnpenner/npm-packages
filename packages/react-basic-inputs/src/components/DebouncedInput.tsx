import type {OverrideProps} from '../types/utility.ts'
import type { FC, MutableRefObject} from 'react';
import {useEffect, useRef, useState} from 'react'

export type DebouncedInputChangeEvent = {
    value: string
}

export type DebouncedInputProps = OverrideProps<'input', {
    value: string
    /**
     * Triggers after `debounce` milliseconds following an input change or immediately when the input loses focus.
     */
    onChange: (ev: DebouncedInputChangeEvent) => void
    /**
     * The delay in milliseconds before the `onChange` event is triggered. This delay is reset with each new input
     * event.
     */
    debounce?: number
}, 'defaultValue' | 'onInput' | 'onBlur'>


type Timer = ReturnType<typeof setTimeout>

function clearTimer(timer: MutableRefObject<Timer | null>) {
    if(timer.current != null) {
        clearTimeout(timer.current)
        timer.current = null
    }
}

export const DebouncedInput: FC<DebouncedInputProps> = (({
    value: valueProp,
    onChange,
    debounce = 500,
    ...props
}) => {
    const timer = useRef<Timer | null>(null)
    const [inputValue, setInputValue] = useState(valueProp)

    useEffect(() => {
        clearTimer(timer)
        setInputValue(valueProp)
    }, [valueProp])

    const fireChange = () => {
        if(inputValue !== valueProp) {
            onChange?.({value: inputValue})
        }
    }

    return (
        <input {...props} value={inputValue} onChange={ev => {
            setInputValue(ev.currentTarget.value)
            clearTimer(timer)
            timer.current = setTimeout(fireChange, debounce)
        }} onBlur={() => {
            clearTimer(timer)
            fireChange()
        }} />
    )
})
