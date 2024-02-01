import {FormEventHandler, forwardRef, useImperativeHandle, useLayoutEffect, useRef, useState} from 'react'
import {HtmlTextAreaElement, OverrideProps} from '../types/utility'
import {useEventHandler} from '../hooks/useEvent'


export type TextAreaProps = OverrideProps<'textarea', {}>


export const TextArea = forwardRef<HtmlTextAreaElement, TextAreaProps>(function TextArea({
    onInput,
    style,
    ...rest
}, fwdRef) {
    const ref = useRef<HtmlTextAreaElement>(null)
    const [height, setHeight] = useState('auto')

    useImperativeHandle(fwdRef, () => ref.current)

    const adjustHeight = () => {
        const textarea = ref.current
        if(!textarea) return
        // Reset the height to 'auto' to ensure the scrollHeight gets recalculated correctly
        textarea.style.height = 'auto'
        // Set the height to scrollHeight to fit the content
        const newHeight = `${textarea.scrollHeight}px`
        setHeight(newHeight)
        textarea.style.height = newHeight // This line ensures the height is applied immediately
    }

    const input = useEventHandler<FormEventHandler<HtmlTextAreaElement>>(ev => {
        adjustHeight()
        onInput?.(ev)
    })

    useLayoutEffect(() => {
        adjustHeight()
    }, [])

    return <textarea {...rest} style={{
        ...style,
        overflow: 'hidden',
        resize: 'none',
        height: height,
    }} onInput={input} ref={ref} />
})
