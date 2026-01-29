import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'
import type {Numeric} from '../attributes/StandardGlobalAttributes'

export interface TextareaAttributes extends CommonAttributes<ElementForTag<'textarea'>> {
    /** autocomplete attribute. */
    autocomplete?: string
    /** cols attribute. */
    cols?: Numeric
    /** dirname attribute. */
    dirname?: string
    /** disabled attribute. */
    disabled?: string
    /** form attribute. */
    form?: string
    /** maxlength attribute. */
    maxlength?: Numeric
    /** minlength attribute. */
    minlength?: Numeric
    /** name attribute. */
    name?: string
    /** placeholder attribute. */
    placeholder?: string
    /** readonly attribute. */
    readonly?: string
    /** required attribute. */
    required?: string
    /** rows attribute. */
    rows?: Numeric
    /** wrap attribute. */
    wrap?: string
}

