import type { TextInputProps} from './TextInput';
import {TextInput} from './TextInput'


export type SearchInputProps = Omit<TextInputProps, 'inputMode'>

export function SearchInput(props: SearchInputProps) {
    return <TextInput inputMode="search" {...props}/>
}
