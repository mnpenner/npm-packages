import {Attributes, JsxComponent, JsxChildren, CommonProps} from './types'
import {JsxElement, JsxFragment, JsxNode} from './jsx-nodes'
import * as util from '@mnpenner/is-type'
import {isJsxComponent} from './util'


// https://github.com/facebook/react/blob/ce2bc58a9f6f3b0bfc8c738a0d8e2a5f3a332ff5/packages/react/src/jsx/ReactJSXElementValidator.js#L305
export function jsx(tag: string | JsxComponent, props: CommonProps, key: unknown, isStaticChildren: unknown, source: unknown, self: unknown): JsxNode {
    if(isJsxComponent(tag)) {
        return tag(props)
    }

    return new JsxElement(tag, props)
}

export function Fragment({children}: CommonProps) {
    return new JsxFragment(children)
}
