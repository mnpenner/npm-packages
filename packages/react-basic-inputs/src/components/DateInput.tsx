import type {OmitProps} from "../types/utility";

export type DateInputProps = OmitProps<'input', 'type'>

export function DateInput(props: DateInputProps) {
    return <input type="date" {...props} />
}

