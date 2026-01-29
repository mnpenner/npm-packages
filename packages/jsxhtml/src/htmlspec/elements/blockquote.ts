import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'

export interface BlockquoteAttributes extends CommonAttributes<ElementForTag<'blockquote'>> {
    /** cite attribute. */
    cite?: string
}

