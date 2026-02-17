import type {EventCallback, HtmlInputElement, OverrideProps} from "../types/utility";
import {Input} from "./Input";
import type {ComponentPropsWithRef, ComponentPropsWithoutRef} from "react";
import {formatStrNumber, numberToString, stringToNumber} from "../util/format";

export type NumberChangeEvent = {
    value: number
    type: 'change'
    timeStamp: number
    target: HtmlInputElement
}
export type NumberChangeEventHandler = EventCallback<NumberChangeEvent>

export type NumberInputProps = OverrideProps<typeof Input, {
    value?: number
    placeholder?: string | number
    onChange?: NumberChangeEventHandler
    ref?: ComponentPropsWithRef<typeof Input>['ref']
}, 'type'>

// TODO: format as a number and return Number type for ev.value


export function NumberInput({placeholder, formatOnChange = formatStrNumber, onChange, value, ref, ...otherProps}: NumberInputProps) {
    const props: ComponentPropsWithoutRef<typeof Input> = {
        inputMode: 'decimal',
        ...otherProps,
        formatOnChange,
        type: 'number',
    }

    if (value !== undefined) {
        props.value = numberToString(value)
    }
    if (placeholder != null) {
        props.placeholder = String(placeholder)
    }
    if (onChange != null) {
        props.onChange = ev => {
            onChange({
                ...ev,
                value: stringToNumber(ev.value)
            })
        }
    }

    return <Input {...props} ref={ref}/>
}
