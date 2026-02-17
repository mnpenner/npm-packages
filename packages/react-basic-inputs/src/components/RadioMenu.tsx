import type {EventCallback, HtmlInputElement, NonNil, OverrideProps} from '../types/utility'
import type {ChangeEventHandler, Key, ReactNode} from 'react';
import { useId} from 'react'
import type {Resolvable} from '../util/resolvable'
import {useEventHandler} from '../hooks/useEvent'
import {KeyFixer} from '../util/key-fixer'
import {assumeType} from '../util/assert'
import type {JSX} from 'react/jsx-runtime'


export type RadioMenuOption<T extends NonNil> = OverrideProps<'input', {
    value: T
    text: ReactNode
    key?: Resolvable<Key, [RadioMenuOption<T>, number]>
    itemClassName?: string
    labelClassName?: string
    inputClassName?: string
    textClassName?: string
}, 'type' | 'children' | 'checked' | 'name' | 'className'>



export type RadioMenuChangeEvent<T> = {
    value: T
    // option: SelectOption<T>
    // event: ChangeEvent<HtmlSelectElement>
    index: number
    type: 'change'
    timeStamp: number
    target: HtmlInputElement
}

export type RadioMenuChangeEventHandler<T> = EventCallback<RadioMenuChangeEvent<T>>



export type RadioMenuProps<T extends NonNil> = {
    options: RadioMenuOption<T>[]
    value?: T | null
    className?: string
    /**
     * Value comparison function. Defaults to {@linkcode https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is|Object.is}
     */
    valueEquals?: (a: T, b: T) => boolean
    onChange?: RadioMenuChangeEventHandler<T>
    name?: string
}

export function RadioMenu<T extends NonNil>(menu: RadioMenuProps<T>) {
    const defaultId = useId()
    const name = menu.name ?? defaultId
    const eq = menu.valueEquals ?? Object.is
    const fixedOptions = menu.options ?? []
    const fixer = new KeyFixer()

    const onChange = useEventHandler<ChangeEventHandler<HtmlInputElement>>(ev => {
        const selectedIndex = Number(ev.target.value)
        const selectedOption = fixedOptions[selectedIndex]
        if(selectedOption != null && menu.onChange != null) {
            menu.onChange({
                value: selectedOption.value,
                index: selectedIndex,
                type: 'change',
                timeStamp: ev.timeStamp,
                target: ev.target,
            })
        }
    })

    return (
        <ul className={menu.className}>
            {fixedOptions.map((opt, idx) => {
                const {value, text, key, itemClassName, labelClassName, inputClassName, textClassName, ...rest} = opt
                assumeType<JSX.IntrinsicElements['input']>(rest)
                const fixedKey = fixer.fix(opt, idx)
                if(menu.value !== undefined) {
                    rest.checked = eq(value, menu.value as any)
                }
                // const checked = value === undefined ? undefined : eq(value, menu.value)
                return (
                    <li key={fixedKey} className={itemClassName} aria-disabled={rest.disabled}>
                        <label className={labelClassName}>
                            <input {...rest} className={inputClassName} value={idx} onChange={onChange} name={name} type="radio" />
                            <span className={textClassName}>{text}</span>
                        </label>
                    </li>
                )
            })}
        </ul>
    )
}
