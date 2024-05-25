import {useContext} from 'react'
import {OverrideProps} from '../types/utility.ts'
import {BasicSelectContext} from '../contexts/BasicSelectContext.ts'

export type BasicOptionProps<T> = OverrideProps<'option', {
    value: T
}>

export function BasicOption<T>(props: BasicOptionProps<T>) {
    const ctx = useContext(BasicSelectContext)
    return <option {...props} value={ctx ? ctx.fixer.fix(props, ctx.index++) : String(props.value)} />
}
