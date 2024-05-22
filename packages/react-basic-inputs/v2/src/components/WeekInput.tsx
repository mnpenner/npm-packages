import {OmitProps} from "../types/utility";

export type WeekInputProps = OmitProps<'input', 'type'>

export function WeekInput(props: WeekInputProps) {
    return <input type="week" {...props} />
}

