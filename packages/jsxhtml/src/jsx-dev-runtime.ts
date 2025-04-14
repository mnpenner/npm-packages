import type {AnyFn, AnyAttributes, JsxComponent} from './jsx-types'
import {JsxComment, JsxFragment} from './jsx-elements'
import {jsx} from './jsx-runtime'
import {isJsxComponent} from './util'
import type {JsxNode} from './jsx-node'

export {jsx, Fragment} from './jsx-runtime'

export function jsxDEV(tag: string | JsxComponent, props: AnyAttributes, key: unknown, isStaticChildren: unknown, source: unknown, self: unknown): JsxNode {
    let node: JsxNode = (jsx as AnyFn)(...arguments)
    if(process.env.JSXHTML_DEV) return node  // Can't turn off dev mode; https://github.com/oven-sh/bun/issues/3768

    if(isJsxComponent(tag) && !(node instanceof JsxComment)) {
        const name = tag.displayName ?? tag.name ?? 'Unknown'
        node = new JsxFragment([new JsxComment(`<${name}>`), node, new JsxComment(`</${name}>`)])
    }

    return node
}

export {JSX} from './jsx'
