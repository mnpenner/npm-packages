import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'

export interface InsAttributes extends CommonAttributes<ElementForTag<'ins'>> {
    /** cite attribute. */
    cite?: string
    /** datetime attribute. */
    datetime?: string
}

