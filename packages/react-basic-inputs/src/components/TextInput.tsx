import {collapseWhitespace} from '../util/format'
import type { InputProps} from "./Input";
import {Input} from "./Input";


export type TextInputProps = Omit<InputProps, 'text'>

export function TextInput({formatOnChange = collapseWhitespace, ...otherProps}: TextInputProps) {
    return <Input formatOnChange={formatOnChange} {...otherProps} type="text"/>
}
