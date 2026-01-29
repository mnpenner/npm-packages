import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'
import type {Numeric} from '../attributes/StandardGlobalAttributes'

export interface DataAttributes extends CommonAttributes<ElementForTag<'data'>> {
    /**
     * This attribute specifies the machine-readable translation of the content of the element.
     */
    value?: string | Numeric
}

