import type { OverrideProps } from '../types/utility.ts'
import type { FC } from 'react'

import { useRef, useState } from 'react'

import { useEventHandler } from '../hooks/useEvent.ts'

export type DebouncedInputChangeEvent = {
    value: string
}

export type DebouncedInputProps = OverrideProps<
    'input',
    {
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
    },
    'defaultValue' | 'onInput' | 'onBlur'
>

type Timer = ReturnType<typeof setTimeout>

export const DebouncedInput: FC<DebouncedInputProps> = ({
    value: valueProp,
    onChange,
    debounce = 500,
    ...props
}) => {
    const timer = useRef<Timer | null>(null)
    const [inputValue, setInputValue] = useState(valueProp)
    const [prevValueProp, setPrevValueProp] = useState(valueProp)

    if (valueProp !== prevValueProp) {
        setPrevValueProp(valueProp)
        setInputValue(valueProp)
    }

    const fireChange = useEventHandler(() => {
        if (inputValue !== valueProp) {
            onChange?.({ value: inputValue })
        }
    })

    return (
        <input
            {...props}
            value={inputValue}
            onChange={(ev) => {
                setInputValue(ev.currentTarget.value)
                if (timer.current != null) {
                    clearTimeout(timer.current)
                }
                timer.current = setTimeout(() => fireChange(), debounce)
            }}
            onBlur={() => {
                if (timer.current != null) {
                    clearTimeout(timer.current)
                    timer.current = null
                }
                fireChange()
            }}
        />
    )
}
