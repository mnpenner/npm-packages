import {
    FormEventHandler,
    forwardRef, useCallback,
    useImperativeHandle,
    useLayoutEffect,
    useRef,
    useState
} from 'react'
import {HtmlTextAreaElement, OverrideProps, VoidFn} from '../types/utility'
import {useEventHandler} from '../hooks/useEvent'

export type TextAreaRef = {
    element: HtmlTextAreaElement|null,
    adjustHeight: VoidFn,
}


export type TextAreaProps = OverrideProps<'textarea', {
    /** Initial/minimum height. "0" or "auto" are good choices. Defaults to "auto" */
    initialHeight?: string
}>

export const TextArea = forwardRef<TextAreaRef, TextAreaProps>(function TextArea({
    onInput,
    style,
    initialHeight = 'auto',
    ...rest
}, fwdRef) {
    const ref = useRef<HtmlTextAreaElement>(null)
    const [height, setHeight] = useState(initialHeight)

    const adjustHeight = useCallback(() => {
        const textarea = ref.current
        if(!textarea) return
        // Reset the height to 'auto' to ensure the scrollHeight gets recalculated correctly
        textarea.style.height = initialHeight
        // Set the height to scrollHeight to fit the content
        const newHeight = `${textarea.scrollHeight}px`
        setHeight(newHeight)
        textarea.style.height = newHeight  // This line ensures the height is applied immediately
    }, [initialHeight])

    useImperativeHandle(fwdRef, () => ({
        element: ref.current,
        adjustHeight: adjustHeight,
    }), [adjustHeight])

    const input = useEventHandler<FormEventHandler<HtmlTextAreaElement>>(ev => {
        adjustHeight()
        onInput?.(ev)
    })

    useLayoutEffect(() => {  // TODO: just use CSS `field-sizing: content`
        adjustHeight()

        const textarea = ref.current
        if(!textarea) return
        const resizeObserver = new ResizeObserver(_entries => {
            adjustHeight()
        })
        resizeObserver.observe(textarea)
        return () => {
            resizeObserver.unobserve(textarea)
        }
    }, [adjustHeight])

    return <textarea {...rest} style={{
        overflow: 'hidden',  // these 2 styles aren't needed if the caller sets them in CSS.
        resize: 'none',
        ...style,
        height: height,
    }} onInput={input} ref={ref} />
})
