import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'
import type {Numeric} from '../attributes/StandardGlobalAttributes'

export interface LiAttributes extends CommonAttributes<ElementForTag<'li'>> {
    /** value attribute. */
    value?: string | Numeric
}

