import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'
import type {Numeric} from '../attributes/StandardGlobalAttributes'

export interface SelectAttributes extends CommonAttributes<ElementForTag<'select'>> {
    /** autocomplete attribute. */
    autocomplete?: string
    /** disabled attribute. */
    disabled?: string
    /** form attribute. */
    form?: string
    /** multiple attribute. */
    multiple?: string
    /** name attribute. */
    name?: string
    /** required attribute. */
    required?: string
    /** size attribute. */
    size?: Numeric
}

