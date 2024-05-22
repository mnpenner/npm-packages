import {Override} from "../types/utility";
import {Input, InputProps} from "./Input";

export type PasswordInputProps = Override<InputProps, {
    autoComplete: 'new-password' | 'current-password'
}>

export function PasswordInput(props: PasswordInputProps) {
    return <Input type="password" {...props} />
}

