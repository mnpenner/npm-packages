import type { TextInputProps} from './TextInput';
import {TextInput} from './TextInput'


export type DecimalInputProps = Omit<TextInputProps, 'inputMode'>

export function DecimalInput(props: DecimalInputProps) {
    return <TextInput inputMode="decimal" pattern="-?([0-9]{1,16}(\.[0-9]{0,20})?|\.[0-9]{1,20})" {...props}/>
}
