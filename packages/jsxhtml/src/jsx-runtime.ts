import {Attributes, Component, JsxhtmlChildren} from './types'
import JsxhtmlElement from './JsxhtmlElement'
import * as util from '@mnpenner/is-type'

export function jsx(tag: string | Component, attrs: Attributes, ...children: JsxhtmlChildren): JsxhtmlElement {
    if(util.isFunction(tag)) {
        return (tag as Component)({...attrs, children})
    }

    return new JsxhtmlElement(tag as string, attrs ?? Object.create(null), children ?? [])
}
