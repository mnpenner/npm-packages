import type {Override} from "../types/utility";
import type { InputProps} from "./Input";
import {Input} from "./Input";

export type PasswordInputProps = Override<InputProps, {
    autoComplete: 'new-password' | 'current-password'
}>

export function PasswordInput(props: PasswordInputProps) {
    return <Input type="password" pattern="\S(?:.*\S)?" {...props} />
}

