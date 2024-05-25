import {EventCallback, HtmlSelectElement, nil, OverrideProps} from '../types/utility.ts'
import {ChangeEventHandler, useMemo, useRef} from 'react'
import {iterateChildren} from '../util/react-children.ts'
import {deepEqual, fmap} from '../util/collections.ts'
import {KeyFixer} from '../util/key-fixer.ts'
import {useLayoutEffectCounter} from '../hooks/useOnce.ts'
import {BasicOption} from './BasicOption.tsx'
import {BasicSelectContext} from '../contexts/BasicSelectContext.ts'


export type BasicSelectChangeEvent<T> = {
    value: T
    // option: SelectOption<T>
    // event: ChangeEvent<HtmlSelectElement>
    index: number
    type: 'change'
    timeStamp: number
    target: HtmlSelectElement
}

export type BasicSelectChangeEventHandler<T> = EventCallback<BasicSelectChangeEvent<T>>


export type BasicSelectProps<T> = OverrideProps<'select', {
    value?: T | null
    defaultValue?: T | null
    onChange?: BasicSelectChangeEventHandler<T>,
    equals?: (a: T | nil, b: T | nil) => boolean
}, 'defaultChecked'>


/**
 * A lot like a normal <select> but supports any type of value.
 * Also, if the value is not in the list of options, the <select> will be blanked in the UI instead of
 * looking as though the first value is selected.
 */
export function BasicSelect<T>({
    value: propValue,
    defaultValue,
    onChange,
    children,
    equals = deepEqual,
    ...props
}: BasicSelectProps<T>) {
    const values = useMemo(() => fmap(iterateChildren(children), child => {
        if(child.type === 'option' || child.type === BasicOption) {
            return child.props.value
        }
    }), [children])

    const ref = useRef<HtmlSelectElement | null>(null)
    const selectedIndex = useRef<number>(-1)

    // console.log(values)

    const changeHandler: ChangeEventHandler<HtmlSelectElement> = ev => {
        const index = ev.target.selectedIndex
        selectedIndex.current = index
        // console.log('selected',index)
        const value = values[index]
        onChange?.({
            value,
            index,
            type: 'change',
            timeStamp: ev.timeStamp,
            target: ev.target,
        })
    }

    useLayoutEffectCounter(count => {
        if(ref.current == null) return
        if(count === 0) {
            // Use `defaultValue` for first render
            const initialValue = propValue !== undefined ? propValue : defaultValue
            selectedIndex.current = initialValue === undefined
                ? -1
                : ref.current.selectedIndex = values.findIndex(v => equals(v, initialValue))
        } else if(propValue !== undefined) {
            // When the property-value changes, select the first matching option if an equivalent value isn't already selected
            if(!equals(propValue, values[ref.current.selectedIndex])) {
                selectedIndex.current = ref.current.selectedIndex = values.findIndex(v => equals(v, propValue))
            }
        } else {
            // Restore the previously selectedIndex after a hot reload
            ref.current.selectedIndex = selectedIndex.current
        }
    }, [equals, propValue, values])

    return (
        <select {...props} ref={ref} onChange={changeHandler}>{children}</select>
    )
}
