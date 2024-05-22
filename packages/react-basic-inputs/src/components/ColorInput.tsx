import {HtmlInputElement} from "../types/utility";
import {forwardRef} from "react";
import {Input, InputProps} from "./Input";

export type ColorInputProps = Omit<InputProps, 'type'>

export const ColorInput = forwardRef<HtmlInputElement, ColorInputProps>(function ColorInput(props, ref) {
    return <Input {...props} ref={ref} type="color"/>
})
