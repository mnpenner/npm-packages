import {OmitProps, PartiallyRequired} from "../types/utility";

export type PasswordInputProps = PartiallyRequired<OmitProps<'input', 'type'>, 'autoComplete'>

export function PasswordInput(props: PasswordInputProps) {
    return <input type="password" {...props} />
}

