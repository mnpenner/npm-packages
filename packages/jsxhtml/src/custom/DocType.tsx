import type {DocTypeProps} from '../jsx-elements'
import {JsxDocType} from '../jsx-elements'

/**
 * The `<!DOCTYPE>` node.
 */
export function DocType(props: DocTypeProps) {
    return new JsxDocType(props)
}
