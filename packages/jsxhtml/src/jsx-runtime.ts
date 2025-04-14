import type { JsxComponent, AnyAttributes, ChildrenOnly} from './jsx-types';
import {EMPTY, JsxElement, JsxFragment, JsxRawHtml} from './jsx-elements'
import {isEmptyRender, isJsxComponent} from './util'
import type { JsxNode} from './jsx-node';
import {isJsxNode} from './jsx-node'


// https://github.com/facebook/react/blob/ce2bc58a9f6f3b0bfc8c738a0d8e2a5f3a332ff5/packages/react/src/jsx/ReactJSXElementValidator.js#L305
export function jsx(tag: string | JsxComponent, props: AnyAttributes, key?: unknown, isStaticChildren?: unknown, source?: unknown, self?: unknown): JsxNode {
    if(isJsxComponent(tag)) {
        const node = tag(props)
        if(!isJsxNode(node)) {
            // All components *should* return JsxNodes, but if they don't, wrap them in one so that the output of <El>
            // is *always* a JsxNode.
            if(isEmptyRender(node)) {
                return EMPTY
            }
            return new JsxFragment(node)
        }
        return node
    }

    return new JsxElement(tag, props)
}

export function jsxs(...args: Parameters<typeof jsx>): JsxNode {
    // Processes all the children immediately so that this is fast to render later.
    return new JsxRawHtml(jsx(...args).toString())
}

export function Fragment({children}: ChildrenOnly) {
    return new JsxFragment(children)
}
