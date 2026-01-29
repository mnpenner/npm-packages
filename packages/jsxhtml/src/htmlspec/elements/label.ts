import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'

export interface LabelAttributes extends CommonAttributes<ElementForTag<'label'>> {
    /**
     * The **`for`** attribute is an allowed attribute for label and output. When used on a `<label ` element it indicates the form element that this label describes. When used on an `<output ` element it allows for an explicit relationship between the elements that represent values which are used in the output.
     */
    for?: string
}

