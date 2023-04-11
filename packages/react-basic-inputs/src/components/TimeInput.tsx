export type TimeInputProps = OmitProps<'input', 'type'>

export function TimeInput(props: TimeInputProps) {
    return <input type="time" {...props} />
}

