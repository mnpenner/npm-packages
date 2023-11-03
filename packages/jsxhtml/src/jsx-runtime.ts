import {Attributes, Component, JsxhtmlChildren, Props} from './types'
import JsxhtmlElement, {JsxhtmlFragment} from './JsxhtmlElement'
import * as util from '@mnpenner/is-type'



export function jsx(tag: string | Component, props: Props): JsxhtmlElement {
    if(util.isFunction(tag)) {
        return (tag as Component)(props)
    }

    return new JsxhtmlElement(tag as string, props)
}

export function Fragment({children}: Props) {
    return new JsxhtmlFragment(children)
}
