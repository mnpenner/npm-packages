import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'
import type {Numeric} from '../attributes/StandardGlobalAttributes'

export interface OptionAttributes extends CommonAttributes<ElementForTag<'option'>> {
    /** disabled attribute. */
    disabled?: string
    /** label attribute. */
    label?: string
    /** selected attribute. */
    selected?: string
    /** value attribute. */
    value?: string | Numeric
}

