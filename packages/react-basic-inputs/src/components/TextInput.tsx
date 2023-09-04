import {collapseWhitespace} from '../util/format'
import {Input, InputProps} from "./Input";


export type TextInputProps = Omit<InputProps, 'text'>

export function TextInput({formatOnChange = collapseWhitespace, ...otherProps}: TextInputProps) {
    return <Input formatOnChange={formatOnChange} {...otherProps} type="text"/>
}
