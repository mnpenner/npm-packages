export type NumberInputProps = OverrideProps<'input', {
    value?: number
    placeholder?: string | number
}, 'type'>

export function NumberInput({placeholder, ...props}: NumberInputProps) {
    return <input type="number" {...props} placeholder={placeholder == null ? undefined : String(placeholder)}/>
}

