import {EMPTY, JsxComment} from '../jsx-elements'
import {flattenString} from '../util'
import type {StringChildren} from '../jsx-types'

/**
 * An HTML `<!-- comment -->`.
 */
export function C({children}: StringChildren) {
    if(process.env.NODE_ENV === 'production') {
        return EMPTY
    }
    return new JsxComment(` ${flattenString(children)} `)
}
