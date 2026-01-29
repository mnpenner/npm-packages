import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'
import type {Numeric} from '../attributes/StandardGlobalAttributes'

export interface ObjectAttributes extends CommonAttributes<ElementForTag<'object'>> {
    /**
     * The address of the resource as a valid URL. At least one of **data** and **type** must be defined.
     */
    data?: string
    /**
     * The `form` HTML attribute associates a form-associated element with a form element within the same document. This attribute applies to the button, fieldset, input, object, output, select, and textarea elements.
     */
    form?: string
    /**
     * The height of the displayed resource, as in &lt;integer&gt; in CSS pixels.
     */
    height?: Numeric
    /**
     * The name of valid browsing context (HTML5), or the name of the control (HTML 4). The name becomes a property of the Window and Document objects, containing a reference to the embedded window or the element itself.
     */
    name?: string
    /**
     * The content type of the resource specified by **data**. At least one of **data** and **type** must be defined.
     */
    type?: string
    /**
     * The width of the display resource, as in &lt;integer&gt; in CSS pixels.
     */
    width?: Numeric
}

