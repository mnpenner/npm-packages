export type NumberInputProps = OverrideProps<'input', {
    value?: number
    placeholder?: string | number
}, 'type'>

// TODO: format as a number and return Number type for ev.value
export function NumberInput({placeholder, ...props}: NumberInputProps) {
    return <input type="number" {...props} placeholder={placeholder == null ? undefined : String(placeholder)}/>
}
