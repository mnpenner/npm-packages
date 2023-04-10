import {ComponentPropsWithoutRef, useState} from 'react'
import {collapseWhitespace} from '../util/format'
import {useUpdateEffect} from 'react-use'

export type TextChangeEvent = {
    value: string
}
export type TextChangeEventHandler = EventCallback<TextChangeEvent>  // FIXME: TypeScript can't find this helper type...

export type TextInputProps = OverrideProps<'input', {
    onChange: TextChangeEventHandler
    format: (value: string) => string
}, 'type'>


export function TextInput({onChange, value, format = collapseWhitespace, onBlur, ...props}: TextInputProps) {
    const [inputValue, setInputValue] = useState(value)
    const attrs: ComponentPropsWithoutRef<'input'> = {
        ...props,
        type: 'text',
        value: inputValue,
        onChange: ev => {
            setInputValue(ev.target.value)
        }
    }
    if(onChange || onBlur) {
        attrs.onBlur = ev => {
            onChange?.({
                value: format != null ? format(inputValue) : inputValue
            })
            onBlur?.(ev)
        }
    }
    useUpdateEffect(() => {
        setInputValue(value)
    }, [value])
    return <input {...attrs} />
}
