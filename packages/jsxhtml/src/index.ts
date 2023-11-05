export * from './jsx-elements'
export * from './custom-components'
export * from './elysia-plugin'
export {isJsxNode} from './jsx-node'

// For compat with {"jsx": "react"}
import type {CommonProps, JsxComponent, JsxRenderable} from './types'
import {jsx as _jsx, Fragment as _Fragment} from './jsx-runtime'
namespace React {
    export function createElement(tag: string | JsxComponent, props: CommonProps, ...children: JsxRenderable[]) {
        return _jsx(tag, {...props, children})
    }
    export const Fragment = _Fragment
}
export default React

