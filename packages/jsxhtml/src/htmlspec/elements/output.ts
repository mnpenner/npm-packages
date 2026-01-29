import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'

export interface OutputAttributes extends CommonAttributes<ElementForTag<'output'>> {
    /**
     * The **`for`** attribute is an allowed attribute for label and output. When used on a `<label ` element it indicates the form element that this label describes. When used on an `<output ` element it allows for an explicit relationship between the elements that represent values which are used in the output.
     */
    for?: string
    /**
     * The `form` HTML attribute associates a form-associated element with a form element within the same document. This attribute applies to the button, fieldset, input, object, output, select, and textarea elements.
     */
    form?: string
    /**
     * The element's name. Used in the form.elements API. The `<output ` value, name, and contents are NOT submitted during form submission.
     */
    name?: string
}

