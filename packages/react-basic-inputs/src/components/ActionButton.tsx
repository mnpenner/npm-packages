import type {ComponentPropsWithoutRef} from 'react'
import type {RequiredKeys} from '../types/utility.ts'
import {assumeProps} from '../util/assert.ts'

export type ActionButtonProps = RequiredKeys<ComponentPropsWithoutRef<'button'>, 'onClick'>

export function ActionButton({onClick, ...props}: ActionButtonProps) {
    assumeProps<'button'>(props)
    const handleClick: ActionButtonProps['onClick'] = ev => {
        ev.preventDefault()
        onClick?.(ev)
    }
    return <button type="button" {...props} onClick={handleClick} />
}
