import {JsxRawHtml} from '../jsx-elements'
import {flattenString} from '../util'
import type {StringChildren} from '../jsx-types'

/**
 * Unescaped HTML.
 * @experimental
 */
export function RawHtml({children}: StringChildren) {
    return new JsxRawHtml(flattenString(children))
}
