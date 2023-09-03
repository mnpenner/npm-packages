import {ComponentPropsWithoutRef} from 'react'
import {collapseWhitespace} from '../util/format'
import {EventCallback, OverrideProps} from "../types/utility";
import {Input} from "./Input";

export type TextChangeEvent = {
    value: string
}
export type TextChangeEventHandler = EventCallback<TextChangeEvent>

export type TextInputProps = OverrideProps<typeof Input, {
    /**
     * Function used to format value on blur. Set to `null` to disable.
     * Collapses whitespace by default.
     */
    formatOnChange?: (value: string) => string
}>


export function TextInput({formatOnChange = collapseWhitespace, onChange, ...otherProps}: TextInputProps) {
    const props: ComponentPropsWithoutRef<typeof Input> = otherProps

    if (onChange && formatOnChange) {
        props.onChange = ev => {
            onChange({
                value: formatOnChange(ev.value)
            })
        }
    }

    return <Input {...props} />
}
