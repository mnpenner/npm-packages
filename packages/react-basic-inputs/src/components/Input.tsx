import {ComponentPropsWithoutRef, useRef, useState} from 'react'
import {useUpdateEffect} from 'react-use'
import {EventCallback, HtmlInputElement, OverrideProps} from "../types/utility";
import {identity} from "../util/constants";

export type InputChangeEvent = {
    value: string
    type: 'change'
    timeStamp: number
    target: HtmlInputElement
}
export type InputChangeEventHandler = EventCallback<InputChangeEvent>

export type InputProps = OverrideProps<'input', {
    onChange?: InputChangeEventHandler
    value?: string
    /**
     * Function used to format value on blur.
     */
    formatOnChange?: (value: string) => string
}>


export function Input({value = '', onChange, onInput, onBlur, formatOnChange = identity, ...otherProps}: InputProps) {
    const [currentValue, setCurrentValue] = useState(value)
    const lastValue = useRef(value)
    const modified = useRef(false)

    useUpdateEffect(() => {
        setCurrentValue(value)
        modified.current = false
        lastValue.current = value
    }, [value])

    const props: ComponentPropsWithoutRef<'input'> = {
        type: 'text',
        ...otherProps,
        value: currentValue,
        onChange: ev => {
            setCurrentValue(ev.target.value)
        },
        onInput: ev => {
            modified.current = true
            onInput?.(ev)
        },
        onBlur: ev => {
            const formattedValue = formatOnChange(currentValue)
            if (modified.current) {
                if (formattedValue !== lastValue.current) {
                    onChange?.({
                        type: 'change',
                        value: formattedValue,
                        timeStamp: ev.timeStamp,
                        target: ev.target,
                    })
                    lastValue.current = formattedValue
                }
                if (formattedValue !== ev.target.value) {
                    setCurrentValue(formattedValue)
                }
            }
            onBlur?.(ev)
        }
    }

    return <input {...props} />
}
