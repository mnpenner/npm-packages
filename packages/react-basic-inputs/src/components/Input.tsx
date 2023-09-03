import {ComponentPropsWithoutRef, useRef, useState} from 'react'
import {useUpdateEffect} from 'react-use'
import {EventCallback, OverrideProps} from "../types/utility";

export type InputChangeEvent = {
    value: string
}
export type InputChangeEventHandler = EventCallback<InputChangeEvent>

export type InputProps = OverrideProps<'input', {
    onChange?: InputChangeEventHandler
    value?: string
}>


export function Input({value = '', onChange, onBlur, ...otherProps}: InputProps) {
    const [inputValue, setInputValue] = useState(value)
    const lastValue = useRef(value)

    useUpdateEffect(() => {
        setInputValue(value)
    }, [value])

    const props: ComponentPropsWithoutRef<'input'> = {
        type: 'text',
        ...otherProps,
        value: inputValue,
        onChange: ev => {
            setInputValue(ev.target.value)
        },
        onBlur: ev => {
            if (ev.target.value !== lastValue.current) {
                lastValue.current = ev.target.value
                onChange?.({
                    value: ev.target.value
                })
            }
            onBlur?.(ev)
        }
    }

    return <input {...props} />
}
