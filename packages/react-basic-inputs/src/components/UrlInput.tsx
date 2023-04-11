import {TextInput, TextInputProps} from './TextInput'


export type UrlInputProps = Omit<TextInputProps, 'inputMode'>

export function UrlInput(props: UrlInputProps) {
    return <TextInput inputMode="url" {...props}/>
}
