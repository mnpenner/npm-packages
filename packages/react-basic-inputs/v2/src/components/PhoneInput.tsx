import {TextInput, TextInputProps} from './TextInput'


export type PhoneInputProps = Omit<TextInputProps, 'inputMode'>

export function PhoneInput(props: PhoneInputProps) {
    return <TextInput inputMode="tel" {...props}/>
}
