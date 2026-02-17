import type {ComponentPropsWithRef} from "react";
import type { InputProps} from "./Input";
import {Input} from "./Input";

export type ColorInputProps = Omit<InputProps, 'type'> & {
    ref?: ComponentPropsWithRef<typeof Input>['ref']
}

export function ColorInput({ref, ...props}: ColorInputProps) {
    return <Input {...props} ref={ref} type="color"/>
}
