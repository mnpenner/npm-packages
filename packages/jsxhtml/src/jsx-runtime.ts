import {Attributes, Component, JsxChildren, CommonProps} from './types'
import {JsxElement, JsxFragment, JsxNode} from './jsx-nodes'
import * as util from '@mnpenner/is-type'



export function jsx(tag: string | Component, props: CommonProps): JsxNode {
    if(util.isFunction(tag)) {
        return (tag as Component)(props)
    }

    return new JsxElement(tag as string, props)
}

export function Fragment({children}: CommonProps) {
    return new JsxFragment(children)
}
