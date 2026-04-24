import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'

export interface TimeAttributes extends CommonAttributes<ElementForTag<'time'>> {
    /**
     * This attribute indicates the time and/or date of the element and must be in one of the formats described below.
     */
    datetime?: string
}

