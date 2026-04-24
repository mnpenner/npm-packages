import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'
import type {Numeric} from '../attributes/StandardGlobalAttributes'

export interface SelectAttributes extends CommonAttributes<ElementForTag<'select'>> {
    /**
     * Controls whether the browser may automatically complete the value and provides guidance about the type of information expected in the field.
     *
     * Possible values:
     * - off
     * - on
     */
    autocomplete?: 'off' | 'on'
    /**
     * The Boolean **`disabled`** attribute, when present, makes the element not mutable, focusable, or even submitted with the form. The user can neither edit nor focus on the control, nor its form control descendants.
     */
    disabled?: boolean
    /**
     * The `form` HTML attribute associates a form-associated element with a form element within the same document. This attribute applies to the button, fieldset, input, object, output, select, and textarea elements.
     */
    form?: string
    /**
     * The Boolean **`multiple`** attribute, if set, means the form control accepts one or more values. The attribute is valid for the email and file input types and the select. The manner by which the user opts for multiple values depends on the form control.
     */
    multiple?: boolean
    /**
     * This attribute is used to specify the name of the control.
     */
    name?: string
    /**
     * The Boolean **`required`** attribute, if present, indicates that the user must specify a value for the input before the owning form can be submitted.
     */
    required?: boolean
    /**
     * The **`size`** attribute defines the width of the input and the height of the select element. For an `input` element, it defines the number of characters that the user agent allows the user to see when editing the value. For a `select` element, it defines the number of options that should be shown to the user. This must be a valid non-negative integer greater than zero.
     */
    size?: Numeric

}

