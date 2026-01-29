import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'
import type {Numeric} from '../attributes/StandardGlobalAttributes'

export interface DataAttributes extends CommonAttributes<ElementForTag<'data'>> {
    /** value attribute. */
    value?: string | Numeric
}

