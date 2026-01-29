import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'

export interface FieldsetAttributes extends CommonAttributes<ElementForTag<'fieldset'>> {
    /** disabled attribute. */
    disabled?: string
    /** form attribute. */
    form?: string
    /** name attribute. */
    name?: string
}

