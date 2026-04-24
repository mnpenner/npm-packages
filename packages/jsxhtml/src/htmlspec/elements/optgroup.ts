import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'

export interface OptgroupAttributes extends CommonAttributes<ElementForTag<'optgroup'>> {
    /**
     * The Boolean **`disabled`** attribute, when present, makes the element not mutable, focusable, or even submitted with the form. The user can neither edit nor focus on the control, nor its form control descendants.
     */
    disabled?: boolean
    /**
     * The name of the group of options, which the browser can use when labeling the options in the user interface. This attribute is mandatory if this element is used.
     */
    label?: string
}

