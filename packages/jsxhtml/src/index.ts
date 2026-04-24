export * from './jsx-elements'
export * from './custom-components'
export * from './jsx-node'
export {js} from './template-strings'

// For compat with {"jsx": "react"}
import type {AnyAttributes, JsxComponent, JsxRenderable} from './jsx-types'
import {jsx as _jsx, Fragment as _Fragment} from './jsx-runtime'

namespace React {
    export function createElement(tag: string | JsxComponent, props: AnyAttributes, ...children: JsxRenderable[]) {
        return _jsx(tag, {...props, children})
    }

    export const Fragment = _Fragment
}
export default React

