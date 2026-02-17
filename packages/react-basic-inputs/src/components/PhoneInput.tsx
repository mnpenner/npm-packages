import {TextInput, TextInputProps} from './TextInput'


export type PhoneInputProps = Omit<TextInputProps, 'inputMode'>

export function PhoneInput(props: PhoneInputProps) {
    return <TextInput inputMode="tel" pattern="(?=(?:\D*\d){6,15}\D*$)\+?[0-9 .\(\)\-\u00A0]{4,32}(?:\s*(?:#|x|ext\.?|extension|;ext=)\s*\d{1,10})?" {...props}/>
}
