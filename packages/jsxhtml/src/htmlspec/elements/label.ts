import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'

export interface LabelAttributes extends CommonAttributes<ElementForTag<'label'>> {
    /**
     * The value is the [`id`](/en-US/docs/Web/HTML/Reference/Global_attributes/id) of the [labelable](/en-US/docs/Web/HTML/Guides/Content_categories#labelable) form control in the same document, [associating the `<label>` with that form control](#associating_a_label_with_a_form_control). Note that its JavaScript reflection property is [`htmlFor`](/en-US/docs/Web/API/HTMLLabelElement/htmlFor).
     */
    for?: string
}

