import {EventCallback, HtmlInputElement, OverrideProps} from "../types/utility";
import React from "react";

export interface ColorChangeEvent {
    /** The color, in "#rrggbb" format. */
    value: string
}

export type ColorChangeEventHandler = EventCallback<ColorChangeEvent>

export type ColorInputProps = OverrideProps<'input', {
    onChange?: ColorChangeEventHandler
    onInput?: ColorChangeEventHandler
}, 'type'>

export function ColorInput({onChange, onInput, ...otherProps}: ColorInputProps) {
    // TODO: should we swap onChange and onInput...? should event fire while dragging around color?

    const props: React.ComponentPropsWithoutRef<'input'> = {...otherProps, type: 'color'}

    if (onChange) {
        props.onChange = ev => onChange({
            value: (ev.target as HtmlInputElement).value
        })
    }
    if (onInput) {
        props.onInput = ev => onInput({
            value: (ev.target as HtmlInputElement).value
        })
    }
    return <input {...props} />
}

