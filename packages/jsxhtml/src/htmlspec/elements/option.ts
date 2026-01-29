import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'
import type {Numeric} from '../attributes/StandardGlobalAttributes'

export interface OptionAttributes extends CommonAttributes<ElementForTag<'option'>> {
    /**
     * The Boolean **`disabled`** attribute, when present, makes the element not mutable, focusable, or even submitted with the form. The user can neither edit nor focus on the control, nor its form control descendants.
     */
    disabled?: boolean
    /**
     * This attribute is text for the label indicating the meaning of the option. If the `label` attribute isn't defined, its value is that of the element text content.
     */
    label?: string
    /**
     * If present, this Boolean attribute indicates that the option is initially selected. If the `<option ` element is the descendant of a select element whose `multiple` attribute is not set, only one single `<option ` of this select element may have the `selected` attribute.
     */
    selected?: boolean
    /**
     * The content of this attribute represents the value to be submitted with the form, should this option be selected. If this attribute is omitted, the value is taken from the text content of the option element.
     */
    value?: string | Numeric
}

