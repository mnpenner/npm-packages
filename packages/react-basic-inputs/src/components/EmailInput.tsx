import {TextInput, TextInputProps} from './TextInput'


export type EmailInputProps = Omit<TextInputProps, 'inputMode'>

export function EmailInput(props: EmailInputProps) {
    return <TextInput inputMode="email" {...props}/>
}
