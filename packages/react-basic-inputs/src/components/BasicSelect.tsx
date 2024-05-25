import {EventCallback, HtmlSelectElement, nil, OverrideProps} from '../types/utility.ts'
import {ChangeEventHandler, Children, useMemo} from 'react'
import {loadConfigFromFile} from 'vite'
import {iterateChildren, recursiveForEachChild} from '../util/react-children.ts'
import {deepEqual, fmap} from '../util/collections.ts'
import {useFirstMountState, useMount, useUpdateEffect} from 'react-use'
import {useNullRef} from '../hooks/useNullRef.ts'
import {assert} from '../util/debug.ts'


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
    equals?: (a: T|nil, b: T|nil) => boolean
}, 'defaultChecked'>

export type BasicOptionProps<T> = OverrideProps<'option', {
    value: T
}>


export function BasicOption<T>({value, ...props}: BasicOptionProps<T>) {
    return <option {...props} value={value} />
}

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

    const ref = useNullRef<HtmlSelectElement>()

    // console.log(values)

    const setRef = (el: HtmlSelectElement) => {
        ref.current = el
        if(!el) return
        el.selectedIndex = values.findIndex(v => equals(v, propValue))
    }

    const changeHandler: ChangeEventHandler<HtmlSelectElement> = ev => {
        const index = ev.target.selectedIndex
        const value = values[index]
        onChange?.({
            value,
            index,
            type: 'change',
            timeStamp: ev.timeStamp,
            target: ev.target,
        })
    }

    useUpdateEffect(() => {
        if(ref.current == null) return
        ref.current.selectedIndex = values.findIndex(v => equals(v, propValue))
    }, [propValue])


    // recursiveForEachChild(children, child => {
    //     if(child.type === 'option' || child.type === BasicOption) {
    //         console.log('A',child.props.value)
    //     }
    // })
    //
    // for(const child of iterateChildren(children)) {
    //     if(child.type === 'option' || child.type === BasicOption) {
    //         console.log('B',child.props.value)
    //     }
    // }

    return (
        <select {...props} ref={setRef} onChange={changeHandler}>{children}</select>
    )
}
