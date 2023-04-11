import {TextInput, TextInputProps} from './TextInput'
import {formatUrl} from '../util/format'


export type UrlInputProps = Omit<TextInputProps, 'inputMode'>

export function UrlInput(props: UrlInputProps) {
    return <TextInput inputMode="url" format={formatUrl} {...props}/>
}
