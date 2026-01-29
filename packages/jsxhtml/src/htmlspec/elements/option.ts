import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'
import type {Numeric} from '../attributes/StandardGlobalAttributes'

export interface OptionAttributes extends CommonAttributes<ElementForTag<'option'>> {
    /**
     * If this Boolean attribute is set, this option is not checkable. Often browsers grey out such control and it won't receive any browsing event, like mouse clicks or focus-related ones. If this attribute is not set, the element can still be disabled if one of its ancestors is a disabled  element.
     */
    disabled?: string
    /**
     * This attribute is text for the label indicating the meaning of the option. If the `label` attribute isn't defined, its value is that of the element text content.
     */
    label?: string
    /**
     * If present, this Boolean attribute indicates that the option is initially selected. If the `<option>` element is the descendant of a  element whose [`multiple`](/en-US/docs/Web/HTML/Reference/Elements/select#multiple) attribute is not set, only one single `<option>` of this  element may have the `selected` attribute.
     */
    selected?: string
    /**
     * The content of this attribute represents the value to be submitted with the form, should this option be selected. If this attribute is omitted, the value is taken from the text content of the option element.
     */
    value?: string | Numeric
}

