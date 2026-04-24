import type {ChangeEvent, ReactNode} from 'react';
import { useCallback, useMemo, useRef} from 'react'
import useEvent from '../hooks/useEvent'
import type {Resolvable} from '../util/resolvable'
import {useUpdateEffect} from 'react-use'
import type {EventCallback, HtmlSelectElement, NonNil, OverrideProps} from "../types/utility"
import type {AnyOption} from '../util/key-fixer';
import { KeyFixer} from '../util/key-fixer'


export type SelectOption<T> = OverrideProps<'option', {
    value: T
    text: ReactNode
    uniqueKey?: Resolvable<string, [SelectOption<T>, number]>
}, 'children' | 'selected'>

export interface SelectChangeEvent<T> {
    value: T
    // option: SelectOption<T>
    // event: ChangeEvent<HtmlSelectElement>
    index: number
    type: 'change'
    timeStamp: number
    target: HtmlSelectElement
}

export type SelectChangeEventHandler<T> = EventCallback<SelectChangeEvent<T>>

export type InvalidValueToOption<T> = (value: T) => SelectOption<T>

const defaultMakeInvalidValueOption: InvalidValueToOption<any> = value => ({
    value,
    text: String(value),
    disabled: true,
    key: INVALID_OPTION_KEY
})


export type SelectProps<T extends NonNil> = OverrideProps<'select', {
    options: SelectOption<T>[]
    value?: T | null
    onChange?: SelectChangeEventHandler<T>
    /**
     * Function used to create an <option> when `value` cannot be found in the list of `options`.
     * Set to `null` to disable this behavior.
     * By default, stringifies `value`.
     */
    invalidValueOption?: InvalidValueToOption<T> | null
    /**
     * Text to display when `value` is nullish.
     */
    placeholder?: ReactNode
}, 'children' | 'defaultValue'>

const PLACEHOLDER_KEY = '3c9369b7-0a5e-46ea-93c2-e8b9fec67fdb'
const INVALID_OPTION_KEY = '1a53f789-77f5-4ce6-a829-b00e563f1ee8'

export function Select<T extends NonNil>({
    options,
    value,
    invalidValueOption = defaultMakeInvalidValueOption,
    onChange,
    placeholder,
    ...selectAttrs
}: SelectProps<T>) {
    const isNotSelected = value == null
    const isValid = useMemo(() => value != null && options.some(o => o.value == value), [options, value])

    const extraOption = useMemo(() => {
        if(value == null || !invalidValueOption) return null
        return invalidValueOption(value)
    }, [invalidValueOption, value])

    const fixedOptions = useMemo(() => {
        if(isValid) return options
        const fixedOptions = [...options]
        if(isNotSelected) {
            if(placeholder != null) {
                fixedOptions.unshift({text: placeholder, hidden: true, value: null as any, key: PLACEHOLDER_KEY})
            }
        } else if(extraOption) {
            fixedOptions.push(extraOption)
        }
        return fixedOptions
    }, [isValid, options, isNotSelected, extraOption, placeholder])

    const handleChange = useEvent<ChangeEvent<HtmlSelectElement>>(ev => {
        const idx = ev.target.selectedIndex
        const opt = fixedOptions[idx]
        onChange?.({
            value: opt.value,
            // option: opt,
            // event: ev,
            index: idx,
            type: 'change',
            timeStamp: ev.timeStamp,
            target: ev.target,
        })
    })

    const ref = useRef<HtmlSelectElement | null>(null)

    const refreshSelectedIndex = useCallback(() => {
        if(!ref.current) return
        if(ref.current.selectedIndex < 0 || fixedOptions[ref.current.selectedIndex].value != value) {
            ref.current.selectedIndex = fixedOptions.findIndex(opt => opt.value == value)
        }
    }, [fixedOptions, value])

    const setRef = (el: HtmlSelectElement | null) => {
        ref.current = el
        refreshSelectedIndex()
    }

    useUpdateEffect(() => {
        // TODO: can we avoid this effect? https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
        refreshSelectedIndex()
    }, [refreshSelectedIndex])

    const fixer = new KeyFixer<T>()

    return (
        <select {...selectAttrs} onChange={handleChange} ref={setRef}>
            {fixedOptions.map((opt, idx) => {
                const {value, text, uniqueKey, ...optAttrs} = opt
                const fixedKey = fixer.fix(opt as AnyOption, idx)
                // React wants each option to have a value, even though we aren't using it, otherwise it warns:
                // "Cannot infer the option value of complex children. Pass a `value` prop or use a plain string as children to <option>."
                return <option {...optAttrs} key={fixedKey} value={fixedKey}>{opt.text}</option>
            })}
        </select>
    )
}
