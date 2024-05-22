import {TextInput, TextInputProps} from './TextInput'
import {formatEmail} from '../util/format'


export type EmailInputProps = Omit<TextInputProps, 'inputMode'>

export function EmailInput(props: EmailInputProps) {
    return <TextInput inputMode="email" autoComplete="email" formatOnChange={formatEmail} {...props}/>
}
