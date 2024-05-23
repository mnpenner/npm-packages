import {OverrideProps} from '../types/utility.ts'
import {useEffect, useState} from 'react'
import {useBox} from '../hooks/useBox.ts'

export type DebouncedInputChangeEvent = {
    value: string
}

export type DebouncedInputProps = OverrideProps<'input', {
    value: string
    onChange: (ev: DebouncedInputChangeEvent) => void
    debounce?: number
}>

export function DebouncedInput({
    value: initialValue,
    onChange,
    debounce = 500,
    ...props
}: DebouncedInputProps) {
    const [value, setValue] = useState(initialValue)
    const onChangeRef = useBox(onChange)
    const debounceRef = useBox(debounce)

    useEffect(() => {
        setValue(initialValue)
    }, [initialValue])

    useEffect(() => {
        const timeout = setTimeout(() => {
            onChangeRef.current({value})
        }, debounceRef.current)

        return () => clearTimeout(timeout)
    }, [debounceRef, onChangeRef, value])

    return (
        <input {...props} value={value} onChange={e => setValue(e.target.value)} />
    )
}
