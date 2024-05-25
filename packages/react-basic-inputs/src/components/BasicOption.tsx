import {useContext} from 'react'
import {OverrideProps} from '../types/utility.ts'
import {BasicSelectContext} from '../contexts/BasicSelectContext.ts'

export type BasicOptionProps<T> = OverrideProps<'option', {
    value: T
}>

export function BasicOption<T>({value,...props}: BasicOptionProps<T>) {
    return <option {...props}  />
}
