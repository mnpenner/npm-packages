import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'

export interface LabelAttributes extends CommonAttributes<ElementForTag<'label'>> {
    /** for attribute. */
    for?: string
}

