import {ComponentPropsWithoutRef, useRef, useState} from 'react'
import {collapseWhitespace} from '../util/format'
import {useUpdateEffect} from 'react-use'
import {EventCallback, OverrideProps} from "../types/utility";

export type TextChangeEvent = {
    value: string
}
export type TextChangeEventHandler = EventCallback<TextChangeEvent>

export type TextInputProps = OverrideProps<'input', {
    onChange?: TextChangeEventHandler
    value?: string
    /**
     * Function used to format value on blur. Set to `null` to disable.
     * Collapses whitespace by default.
     */
    format?: (value: string) => string
}, 'type'>


export function TextInput({onChange, value = '', format = collapseWhitespace, onBlur, ...otherProps}: TextInputProps) {
    // TODO: try without setting `value` at all.... with a ref we can manually set it. or will that break typing? we
    // can probably drop the change event altogether.
    const [inputValue, setInputValue] = useState(value)
    const lastValue = useRef(value)
    const props: ComponentPropsWithoutRef<'input'> = {
        ...otherProps,
        type: 'text',
        value: inputValue,
        onChange: ev => {
            setInputValue(ev.target.value)
        },
        onBlur: ev => {
            // TODO: should we avoid formatting if the user didn't type anything?
            // logJson(lastValue.current,ev.target.value,lastValue.current !== ev.target.value)
            // logJson(lastValue.current,inputValue,lastValue.current === inputValue)
            if (lastValue.current !== inputValue) {  // FIXME: should this fire if you set the value with buttons?
                const formattedValue = format != null ? format(inputValue) : inputValue
                // TODO: should we avoid calling onChange if the formatted value hasn't changed...?

                onChange?.({
                    value: formattedValue
                })
                lastValue.current = inputValue
                setInputValue(formattedValue)
            }
            onBlur?.(ev)

        },
    }
    useUpdateEffect(() => {
        setInputValue(value)
        lastValue.current = value
    }, [value])
    return <input {...props} />
}
