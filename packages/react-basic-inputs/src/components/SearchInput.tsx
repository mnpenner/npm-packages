import {TextInput, TextInputProps} from './TextInput'


export type SearchInputProps = Omit<TextInputProps, 'inputMode'>

export function SearchInput(props: SearchInputProps) {
    return <TextInput inputMode="search" {...props}/>
}
