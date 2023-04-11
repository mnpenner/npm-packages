export type ColorInputProps = OmitProps<'input', 'type'>

export function ColorInput(props: ColorInputProps) {
    // TODO: should we swap onChange and onInput...? should event fire while dragging around color?
    return <input type="color" {...props} />
}

