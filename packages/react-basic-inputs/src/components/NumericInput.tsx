import {TextInput, TextInputProps} from './TextInput'


export type NumericInputProps = Omit<TextInputProps, 'inputMode'>

export function NumericInput(props: NumericInputProps) {
    return <TextInput inputMode="numeric" {...props}/>
}
