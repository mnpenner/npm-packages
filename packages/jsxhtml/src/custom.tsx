import {DocTypeProps, EMPTY, JsxComment, JsxDocType, JsxEmpty, JsxRawHtml} from './jsx-nodes'
import {isIterable} from '@mnpenner/is-type'
import {flattenString} from './util'
import {AttrObj, CommonProps, JsxChildren, StringChildren} from './types'


/**
 * Unescaped HTML.
 */
export function RawHtml({children}: StringChildren) {
    return new JsxRawHtml(flattenString(children))
}

/**
 * An HTML `<!-- comment -->`
 */
export function Comment({children}: StringChildren) {
    // console.log(children)
    return new JsxComment(' '+flattenString(children)+' ')
}

/**
 * The `<!DOCTYPE>` node.
 */
export function DocType(props: DocTypeProps) {
    return new JsxDocType(props)
}

/**
 * `<!DOCTYPE html><html ...>{children}</html>`
 */
export function HtmlDocument({children, ...htmlAttrs}: CommonProps) {
    return <>
        <DocType html />
        <html {...htmlAttrs}>
        {children}
        </html>
    </>
}

/**
 * No output.
 */
export function Empty() {
    return EMPTY
}
