import {OverrideProps} from '../types/utility.ts'
import {memo, FC, MutableRefObject} from 'react'
import {useUpdateEffect} from 'react-use'
import {useNullRef} from '../hooks/useNullRef.ts'

export type DebouncedInputChangeEvent = {
    value: string
}

export type DebouncedInputProps = OverrideProps<'input', {
    value: string
    onChange: (ev: DebouncedInputChangeEvent) => void
    debounce?: number
}, 'defaultValue' | 'onInput'>

type Timer = ReturnType<typeof setTimeout>

function clearTimer(timer: MutableRefObject<Timer | null>) {
    if(timer.current != null) {
        clearTimeout(timer.current)
        timer.current = null
    }
}

export const DebouncedInput: FC<DebouncedInputProps> = (({
    value: valueProp,
    onChange,
    debounce = 500,
    ...props
}) => {
    const inputRef = useNullRef<HTMLInputElement>()
    const timer = useNullRef<Timer>()

    useUpdateEffect(() => {
        clearTimer(timer)
        if(inputRef.current != null) {
            inputRef.current.value = valueProp
        }
    }, [valueProp])

    return (
        <input {...props} ref={inputRef} defaultValue={valueProp} onInput={ev => {
            clearTimer(timer)
            const newValue = ev.currentTarget.value
            timer.current = setTimeout(() => {
                if(newValue !== valueProp) {
                    onChange?.({value: newValue})
                }
            }, debounce)
        }} />
    )
})
