import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'
import type {Numeric} from '../attributes/StandardGlobalAttributes'

export interface ObjectAttributes extends CommonAttributes<ElementForTag<'object'>> {
    /** data attribute. */
    data?: string
    /** form attribute. */
    form?: string
    /** height attribute. */
    height?: Numeric
    /** name attribute. */
    name?: string
    /** type attribute. */
    type?: string
    /** width attribute. */
    width?: Numeric
}

