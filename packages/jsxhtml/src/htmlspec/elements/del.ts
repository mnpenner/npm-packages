import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'

export interface DelAttributes extends CommonAttributes<ElementForTag<'del'>> {
    /** cite attribute. */
    cite?: string
    /** datetime attribute. */
    datetime?: string
}

