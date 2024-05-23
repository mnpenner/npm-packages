import {ComponentPropsWithoutRef} from 'react'
import {RequiredKeys} from '../types/utility.ts'
import {assumeProps} from '../util/assert.ts'

export type ActionButtonProps = RequiredKeys<ComponentPropsWithoutRef<'button'>, 'onClick'>

export function ActionButton({onClick, ...props}: ActionButtonProps) {
    assumeProps<'button'>(props)
    props.onClick = ev => {
        ev.preventDefault()
        onClick?.(ev)
    }
    return <button type="button" {...props} />
}
