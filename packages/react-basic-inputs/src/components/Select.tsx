import {ChangeEvent, Key, ReactNode, useCallback, useMemo, useRef} from 'react'
import useEvent from '../hooks/useEvent'
import {Resolvable, resolveValue} from '../util/resolvable'
import {useUpdateEffect} from 'react-use'


export type SelectOption<T> = OverrideProps<'option', {
    value: T
    text: ReactNode
    key?: Resolvable<Key, [SelectOption<T>, number]>
}, 'children' | 'selected'>

export interface SelectChangeEvent<T> {
    value: T
    // option: SelectOption<T>
    // event: ChangeEvent<HTMLSelectElement>
    index: number
}

export type SelectChangeEventHandler<T> = EventCallback<SelectChangeEvent<T>>

export type InvalidValueToOption<T> = (value: T) => SelectOption<T>

const defaultMakeInvalidValueOption: InvalidValueToOption<any> = value => ({value, text: String(value), disabled: true})


export type SelectProps<T extends NonNil> = OverrideProps<'select', {
    options: SelectOption<T>[]
    value?: T | null
    onChange?: SelectChangeEventHandler<T>
    /**
     * Set to `false` or `null` to disable showing an extra option when `value` is invalid.
     * Omit or set to `true` to stringify the `value` and add it as an extra option.
     * Or pass a function that takes a `value` and produces an option.
     */
    invalidValueOption?: InvalidValueToOption<T> | false | true | null
    placeholder?: ReactNode
}, 'children' | 'defaultValue'>

function defaultMakeKey<T>(opt: SelectOption<T>, idx: number): Key {
    if(opt.key != null) {
        return resolveValue(opt.key, opt, idx)
    } else if(typeof opt.value === 'string' || typeof opt.value === 'number') {
        return opt.value
    }
    return idx
}

const PLACEHOLDER_KEY = '3c9369b7-0a5e-46ea-93c2-e8b9fec67fdb'

export function Select<T extends NonNil>({
    options,
    value,
    invalidValueOption,
    onChange,
    placeholder,
    ...selectAttrs
}: SelectProps<T>) {
    const isNotSelected = value == null
    const isValid = useMemo(() => value != null && options.some(o => o.value == value), [options, value])

    const extraOption = useMemo(() => {
        if(value == null || invalidValueOption === false || invalidValueOption === null) return null
        if(invalidValueOption === true || invalidValueOption === undefined) return defaultMakeInvalidValueOption(value)
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

    const handleChange = useEvent<ChangeEvent<HTMLSelectElement>>(ev => {
        const idx = ev.target.selectedIndex
        const opt = fixedOptions[idx]
        onChange?.({
            value: opt.value,
            // option: opt,
            // event: ev,
            index: idx,
        })
    })

    const ref = useRef<HTMLSelectElement | null>(null)

    const refreshSelectedIndex = useCallback(() => {
        if(!ref.current) return
        if(ref.current.selectedIndex < 0 || fixedOptions[ref.current.selectedIndex].value != value) {
            ref.current.selectedIndex = fixedOptions.findIndex(opt => opt.value == value)
        }
    }, [fixedOptions, value])

    const setRef = (el: HTMLSelectElement | null) => {
        ref.current = el
        refreshSelectedIndex()
    }

    useUpdateEffect(() => {
        refreshSelectedIndex()
    }, [refreshSelectedIndex])

    return (
        <select {...selectAttrs} onChange={handleChange} ref={setRef}>
            {fixedOptions.map((opt, idx) => {
                const {value, text, key, ...optAttrs} = opt
                return <option {...optAttrs} key={defaultMakeKey(opt, idx)}>{opt.text}</option>
            })}
        </select>
    )
}
