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
    const [currentValue, setCurrentValue] = useState(value)
    const lastValue = useRef(value)

    useUpdateEffect(() => {
        setCurrentValue(value)
        lastValue.current = value
    }, [value])

    const props: ComponentPropsWithoutRef<'input'> = {
        type: 'text',
        ...otherProps,
        value: currentValue,
        onChange: ev => {
            setCurrentValue(ev.target.value)
        },
        onBlur: ev => {
            if (currentValue !== lastValue.current) {
                lastValue.current = currentValue
                onChange?.({
                    value: currentValue
                })
            }
            onBlur?.(ev)
        }
    }

    return <input {...props} />
}
