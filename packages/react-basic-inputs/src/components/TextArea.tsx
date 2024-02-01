import {FormEventHandler, forwardRef, useImperativeHandle, useLayoutEffect, useRef, useState} from 'react'
import {HtmlTextAreaElement, OverrideProps, VoidFn} from '../types/utility'
import {useEventHandler} from '../hooks/useEvent'

export type TextAreaRef = {
    element: HtmlTextAreaElement,
    resize: VoidFn,
}


export type TextAreaProps = OverrideProps<'textarea', {}>

export const TextArea = forwardRef<TextAreaRef, TextAreaProps>(function TextArea({
    onInput,
    style,
    ...rest
}, fwdRef) {
    const ref = useRef<HtmlTextAreaElement>(null)
    const [height, setHeight] = useState('auto')

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

    useImperativeHandle(fwdRef, () => ({
        element: ref.current,
        resize: adjustHeight,
    }), [setHeight, ref.current])

    const input = useEventHandler<FormEventHandler<HtmlTextAreaElement>>(ev => {
        adjustHeight()
        onInput?.(ev)
    })

    useLayoutEffect(() => {
        adjustHeight()
    }, [])

    return <textarea rows={1} {...rest} style={{
        ...style,
        overflow: 'hidden',
        resize: 'none',
        height: height,
    }} onInput={input} ref={ref} />
})
