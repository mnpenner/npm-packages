import type {AnyFn, CommonProps, JsxComponent} from './types'
import {JsxComment, JsxFragment, JsxNode} from './jsx-nodes'
import {jsx} from './jsx-runtime'
import {isJsxComponent} from './util'

export {jsx, Fragment} from './jsx-runtime'

export function jsxDEV(tag: string | JsxComponent, props: CommonProps, key: unknown, isStaticChildren: unknown, source: unknown, self: unknown): JsxNode {
    let node: JsxNode = (jsx as AnyFn)(...arguments)

    if(isJsxComponent(tag) && !(node instanceof JsxComment)) {
        const name = tag.displayName ?? tag.name ?? 'Unknown'
        node = new JsxFragment([new JsxComment(`<${name}>`), node, new JsxComment(`</${name}>`)])
    }

    return node
}
