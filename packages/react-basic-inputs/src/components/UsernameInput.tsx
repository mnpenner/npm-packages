import type { TextInputProps} from './TextInput';
import {TextInput} from './TextInput'
import {formatUsername} from "../util/format";

export type UsernameInputProps = Omit<TextInputProps, 'autoCapitalize' | 'autoCorrect'>

export function UsernameInput(props: UsernameInputProps) {
    return <TextInput autoCapitalize="off" autoCorrect="off" autoComplete="username"
                      formatOnChange={formatUsername} {...props}/>
}
