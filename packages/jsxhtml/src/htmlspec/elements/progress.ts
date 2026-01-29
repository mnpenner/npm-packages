import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'
import type {Numeric} from '../attributes/StandardGlobalAttributes'

export interface ProgressAttributes extends CommonAttributes<ElementForTag<'progress'>> {
    /** max attribute. */
    max?: string | Numeric
    /** value attribute. */
    value?: string | Numeric
}

