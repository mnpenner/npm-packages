import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'

export interface OutputAttributes extends CommonAttributes<ElementForTag<'output'>> {
    /**
     * A space-separated list of other elements' [`id`](/en-US/docs/Web/HTML/Reference/Global_attributes/id)s, indicating that those elements contributed input values to (or otherwise affected) the calculation.
     */
    for?: string
    /**
     * The  element to associate the output with (its _form owner_). The value of this attribute must be the [`id`](/en-US/docs/Web/HTML/Reference/Global_attributes/id) of a `<form>` in the same document. (If this attribute is not set, the `<output>` is associated with its ancestor `<form>` element, if any.)
     * This attribute lets you associate `<output>` elements to `<form>`s anywhere in the document, not just inside a `<form>`. It can also override an ancestor `<form>` element. The `<output>` element's name and content are not submitted when the form is submitted.
     */
    form?: string
    /**
     * The element's name. Used in the  API.
     */
    name?: string
}

