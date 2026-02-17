import type { ComponentPropsWithRef} from 'react';
import { useRef, useState} from 'react'
import {useUpdateEffect} from 'react-use'
import type {EventCallback, HtmlInputElement, OverrideProps} from "../types/utility";
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
    ref?: ComponentPropsWithRef<'input'>['ref']
    /**
     * Function used to format value on blur.
     */
    formatOnChange?: (value: string) => string
}>


export function Input({value: initialValue = '', onPaste, onChange, onInput, onBlur, formatOnChange = identity, ref, ...otherProps}: InputProps) {
    const [currentValue, setCurrentValue] = useState(initialValue)
    const lastValue = useRef(initialValue)
    const modified = useRef(false)

    useUpdateEffect(() => {
        setCurrentValue(initialValue)
        modified.current = false
        lastValue.current = initialValue
    }, [initialValue])

    const props: ComponentPropsWithRef<'input'> = {
        type: 'text',
        ...otherProps,
        ref,
        value: currentValue,
        onChange: ev => {
            setCurrentValue(ev.target.value)
        },
        // TODO: fire a change event onPaste ?
        // formatOnPaste?
        // onPaste: ev => {
        //     ev.preventDefault()
        //
        //     const clipboard = formatOnChange(ev.clipboardData.getData('text/plain'))
        //     const selectionStart = ev.currentTarget.selectionStart ?? 0
        //     const newText = ev.currentTarget.selectionStart == null
        //         ? clipboard : ev.currentTarget.value.slice(0,ev.currentTarget.selectionStart) + clipboard + ev.currentTarget.value.slice(ev.currentTarget.selectionEnd ?? ev.currentTarget.selectionStart)
        //     setCurrentValue(newText)
        //     ev.currentTarget.value = newText
        //     ev.currentTarget.setSelectionRange(selectionStart+clipboard.length, selectionStart+clipboard.length)
        //     onPaste?.(ev)
        //     // ev.preventDefault()
        //     // setCurrentValue(formatOnChange(ev.clipboardData.getData('text/plain')))
        // },
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
