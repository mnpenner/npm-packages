import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'

export interface FieldsetAttributes extends CommonAttributes<ElementForTag<'fieldset'>> {
    /**
     * If this Boolean attribute is set, all form controls that are descendants of the `<fieldset>`, are disabled, meaning they are not editable and won't be submitted along with the . They won't receive any browsing events, like mouse clicks or focus-related events. By default browsers display such controls grayed out. Note that form elements inside the  element won't be disabled.
     */
    disabled?: string
    /**
     * This attribute takes the value of the [`id`](/en-US/docs/Web/HTML/Reference/Global_attributes/id) attribute of a  element you want the `<fieldset>` to be part of, even if it is not inside the form. Please note that usage of this is confusing - if you want the  elements inside the `<fieldset>` to be associated with the form, you need to use the `form` attribute directly on those elements. You can check which elements are associated with a form via JavaScript, using .
     */
    form?: string
    /**
     * The name associated with the group.
     * > [!NOTE]
     * > The caption for the fieldset is given by the first  element nested inside it.
     */
    name?: string
}

