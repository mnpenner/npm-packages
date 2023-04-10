import {ChangeEvent, Key, ReactNode} from 'react'
import useEvent from '../hooks/useEvent'
import {Resolvable, resolveValue} from '../util/resolvable'
import {useRefEffect} from '../hooks/useRefEffect'


export type SelectOption<T> = OverrideProps<'option', {
    value: T
    text: ReactNode
    key?: Resolvable<Key, [SelectOption<T>, number]>
}, 'children'>

export interface SelectChangeEvent<T> {
    value: T
    // option: SelectOption<T>
    // event: ChangeEvent<HTMLSelectElement>
    index: number
}

export type OptGroup<T> = [label: string, options: SelectOption<T>[]]

export type SelectChangeEventHandler<T> = EventCallback<SelectChangeEvent<T>>

export type SelectProps<T> = OverrideProps<'select', {
    options: SelectOption<T>[]
    value: T
    onChange: SelectChangeEventHandler<T>
}, 'children'>

export type GroupSelectProps<T> = Override<SelectProps<T>, {
    options: OptGroup<T>[]
}>

function makeKey<T>(opt: SelectOption<T>, idx: number): React.Key {
    if(opt.key != null) {
        return resolveValue(opt.key, opt, idx)
    } else if(typeof opt.value === 'string' || typeof opt.value === 'number') {
        return opt.value
    }
    return idx
}

export function Select<T>({options, value, onChange, ...selectAttrs}: SelectProps<T>) {
    const handleChange = useEvent<ChangeEvent<HTMLSelectElement>>(ev => {
        const idx = ev.currentTarget.selectedIndex
        const opt = options[idx]
        onChange({
            value: opt.value,
            // option: opt,
            // event: ev,
            index: idx,
        })
    })

    const ref = useRefEffect<HTMLSelectElement>(el => {
        if(el.selectedIndex < 0 || options[el.selectedIndex].value != value) {
            el.selectedIndex = options.findIndex(opt => opt.value == value)
        }
    })

    return (
        <select {...selectAttrs} onChange={handleChange} ref={ref}>
            {options.map((opt, idx) => {
                const {value, text, key, ...optAttrs} = opt
                return <option {...optAttrs} key={makeKey(opt, idx)}>{opt.text}</option>
            })}
        </select>
    )
}

// export function GroupSelect<T>({options, value, onChange, ...attrs}: GroupSelectProps<T>) {
//     const flatOptions = useMemo(() => options?.length ? options.flatMap(o => o[1]) : EMPTY_ARRAY, [options])
//
//     const handleChange = useCallback((ev: ChangeEvent<HTMLSelectElement>) => {
//         const opt = flatOptions[ev.target.selectedIndex]
//         onChange({
//             value: opt.value,
//             option: opt,
//             event: ev,
//             index: ev.target.selectedIndex,
//         })
//     }, [onChange])
//
//     const ref = useCallback((el: HTMLSelectElement | null) => {
//         if (el && (el.selectedIndex < 0 || flatOptions[el.selectedIndex].value != value)) {
//             el.selectedIndex = flatOptions.findIndex(opt => opt.value == value)
//         }
//     }, [value])
//
//     return (
//         <select {...attrs} onChange={handleChange} ref={ref}>
//             {options.map(([optgroup,opts], idx) => (
//                 <optgroup key={optgroup} label={optgroup}>
//                     {opts.map((opt, idx) => <option key={makeKey(opt,idx)}>{opt.label}</option>)}
//                 </optgroup>
//             ))}
//         </select>
//     )
// }
