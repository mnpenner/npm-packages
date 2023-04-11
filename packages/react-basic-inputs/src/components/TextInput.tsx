import {ComponentPropsWithoutRef, useState} from 'react'
import {collapseWhitespace} from '../util/format'
import {useUpdateEffect} from 'react-use'

export type TextChangeEvent = {
    value: string
}
export type TextChangeEventHandler = EventCallback<TextChangeEvent>

export type TextInputProps = OverrideProps<'input', {
    onChange?: TextChangeEventHandler
    value?: string
    format?: (value: string) => string
}, 'type'>


export function TextInput({onChange, value = '', format = collapseWhitespace, onBlur, ...props}: TextInputProps) {
    const [inputValue, setInputValue] = useState(value)
    const attrs: ComponentPropsWithoutRef<'input'> = {
        ...props,
        type: 'text',
        value: inputValue,
        onChange: ev => {
            setInputValue(ev.target.value)
        },
        onBlur: ev => {
            const formattedValue = format != null ? format(inputValue) : inputValue
            onChange?.({
                value: formattedValue
            })
            onBlur?.(ev)
            setInputValue(formattedValue)
        },
    }
    useUpdateEffect(() => {
        setInputValue(value)
    }, [value])
    return <input {...attrs} />
}
