import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'
import type {Numeric} from '../attributes/StandardGlobalAttributes'

export interface ColgroupAttributes extends CommonAttributes<ElementForTag<'colgroup'>> {
    /** span attribute. */
    span?: Numeric
}

