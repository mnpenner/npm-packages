import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'
import type {Numeric} from '../attributes/StandardGlobalAttributes'

export interface TextareaAttributes extends CommonAttributes<ElementForTag<'textarea'>> {
    /**
     * Controls whether the browser may automatically complete the value and provides guidance about the type of information expected in the field.
     *
     * Possible values:
     * - off
     * - on
     */
    autocomplete?: 'on' | 'off' | string
    /**
     * The visible width of the text control, in average character widths. If it is specified, it must be a positive integer. If it is not specified, the default value is `20`.
     */
    cols?: Numeric
    /**
     * The **`dirname`** attribute can be used on the textarea element and several input types and describes the directionality of the element's text content during form submission. The browser uses this attribute's value to determine whether text the user has entered is left-to-right or right-to-left oriented. When used, the element's text directionality value is included in form submission data along with the `dirname` attribute's value as the name of the field.
     */
    dirname?: string
    /**
     * The Boolean **`disabled`** attribute, when present, makes the element not mutable, focusable, or even submitted with the form. The user can neither edit nor focus on the control, nor its form control descendants.
     */
    disabled?: boolean
    /**
     * The `form` HTML attribute associates a form-associated element with a form element within the same document. This attribute applies to the button, fieldset, input, object, output, select, and textarea elements.
     */
    form?: string
    /**
     * The **`maxlength`** attribute defines the maximum string length that the user can enter into an input or textarea. The attribute must have an integer value of 0 or higher.
     */
    maxlength?: Numeric
    /**
     * The **`minlength`** attribute defines the minimum string length that the user can enter into an input or textarea. The attribute must have an integer value of 0 or higher.
     */
    minlength?: Numeric
    /**
     * The name of the control.
     */
    name?: string
    /**
     * The **`placeholder`** attribute defines the text displayed in a form control when the control has no value. The placeholder text should provide a brief hint to the user as to the expected type of data that should be entered into the control.
     */
    placeholder?: string
    /**
     * The Boolean **`readonly`** attribute, when present, makes the element not mutable, meaning the user can not edit the control.
     */
    readonly?: boolean
    /**
     * The Boolean **`required`** attribute, if present, indicates that the user must specify a value for the input before the owning form can be submitted.
     */
    required?: boolean
    /**
     * The number of visible text lines for the control. If it is specified, it must be a positive integer. If it is not specified, the default value is 2.
     */
    rows?: Numeric
    /**
     * Indicates how the control should wrap the value for form submission. Possible values are: If this attribute is not specified, `soft` is its default value.
     *
     * Possible values:
     * - hard
     * - soft
     * - off
     */
    wrap?: 'hard' | 'soft' | 'off'

}
