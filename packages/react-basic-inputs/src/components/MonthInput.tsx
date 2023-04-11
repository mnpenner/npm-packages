export type MonthInputProps = OmitProps<'input', 'type'>

export function MonthInput(props: MonthInputProps) {
    return <input type="month" {...props} />
}

