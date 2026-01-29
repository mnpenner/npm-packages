import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'

export interface FormAttributes extends CommonAttributes<ElementForTag<'form'>> {
    /** accept-charset attribute. */
    'accept-charset'?: string
    /** autocomplete attribute. */
    autocomplete?: string
    /** name attribute. */
    name?: string
    /** rel attribute. */
    rel?: string
    /** action attribute. */
    action?: string
    /** enctype attribute. */
    enctype?: string
    /** method attribute. */
    method?: string
    /** novalidate attribute. */
    novalidate?: string
    /** target attribute. */
    target?: string
}

