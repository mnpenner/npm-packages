export type PasswordInputProps = PartiallyRequired<OmitProps<'input', 'type'>, 'autocomplete'>

export function PasswordInput(props: PasswordInputProps) {
    return <input type="password" {...props} />
}

