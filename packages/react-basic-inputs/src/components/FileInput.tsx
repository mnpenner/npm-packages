export type FileInputProps = OmitProps<'input', 'type'>

export function FileInput(props: FileInputProps) {
    return <input type="file" {...props} />
}

