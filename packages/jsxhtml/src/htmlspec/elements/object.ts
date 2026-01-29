import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'
import type {Numeric} from '../attributes/StandardGlobalAttributes'

export interface ObjectAttributes extends CommonAttributes<ElementForTag<'object'>> {
    /**
     * The address of the resource as a valid URL. At least one of **data** and **type** must be defined.
     */
    data?: string
    /**
     * The form element, if any, that the object element is associated with (its _form owner_). The value of the attribute must be an ID of a  element in the same document.
     */
    form?: string
    /**
     * The height of the displayed resource, as in  in .
     */
    height?: Numeric
    /**
     * The name of valid browsing context (HTML5), or the name of the control (HTML 4). The name becomes a property of the  and  objects, containing a reference to the embedded window or the element itself.
     */
    name?: string
    /**
     * The [content type](/en-US/docs/Glossary/MIME_type) of the resource specified by **data**. At least one of **data** and **type** must be defined.
     */
    type?: string
    /**
     * The width of the display resource, as in  in .
     */
    width?: Numeric
}

