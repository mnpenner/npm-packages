import {EventCallback, HtmlSelectElement, OverrideProps} from '../types/utility.ts'


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

export type BasicSelectOptions<T> = OverrideProps<'select', {
    value?: T | null
    defaultValue?: T | null
    onChange?: BasicSelectChangeEventHandler<T>
}, 'defaultChecked'>

export function BasicSelect<T>({
    value,
    defaultValue,
    onChange,
    ...props
}: BasicSelectOptions<T>) {
    const setRef = (el: HtmlSelectElement | null) => {
        if(el != null && value == null && defaultValue == null) {
            el.selectedIndex = -1
        }
    }

    return (
        <select ref={setRef} {...props}/>
    )
}
