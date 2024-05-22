import {OmitProps} from "../types/utility";

export type DatetimeLocalInputProps = OmitProps<'input', 'type'>

export function DatetimeLocalInput(props: DatetimeLocalInputProps) {
    return <input type="datetime-local" {...props} />
}

