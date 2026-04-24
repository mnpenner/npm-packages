import type { TextInputProps} from './TextInput';
import {TextInput} from './TextInput'


export type NumericInputProps = Omit<TextInputProps, 'inputMode'>

export function NumericInput(props: NumericInputProps) {
    return <TextInput inputMode="numeric" pattern="[0-9,\.\+\(\) \-]+" {...props}/>
}
