import {TextInput, TextInputProps} from './TextInput'


export type DecimalInputProps = Omit<TextInputProps, 'inputMode'>

export function DecimalInput(props: DecimalInputProps) {
    return <TextInput inputMode="decimal" {...props}/>
}
