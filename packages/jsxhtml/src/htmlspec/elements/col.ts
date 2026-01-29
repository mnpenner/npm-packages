import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'
import type {Numeric} from '../attributes/StandardGlobalAttributes'

export interface ColAttributes extends CommonAttributes<ElementForTag<'col'>> {
    /** span attribute. */
    span?: Numeric
}

