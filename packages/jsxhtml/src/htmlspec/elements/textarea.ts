import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'
import type {Numeric} from '../attributes/StandardGlobalAttributes'

export interface TextareaAttributes extends CommonAttributes<ElementForTag<'textarea'>> {
    /**
     * Controls whether entered text can be automatically completed by the browser. Possible values are:
     */
    autocomplete?: string
    /**
     * The visible width of the text control, in average character widths. If it is specified, it must be a positive integer. If it is not specified, the default value is `20`.
     */
    cols?: Numeric
    /**
     * This attribute is used to indicate the text directionality of the element contents.
     * For more information, see the [`dirname` attribute](/en-US/docs/Web/HTML/Reference/Attributes/dirname).
     */
    dirname?: string
    /**
     * This Boolean attribute indicates that the user cannot interact with the control. If this attribute is not specified, the control inherits its setting from the containing element, for example ; if there is no containing element when the `disabled` attribute is set, the control is enabled.
     */
    disabled?: string
    /**
     * The form element that the `<textarea>` element is associated with (its "form owner"). The value of the attribute must be the `id` of a form element in the same document. If this attribute is not specified, the `<textarea>` element must be a descendant of a form element. This attribute enables you to place `<textarea>` elements anywhere within a document, not just as descendants of form elements.
     */
    form?: string
    /**
     * The maximum string length (measured in ) that the user can enter. If this value isn't specified, the user can enter an unlimited number of characters.
     */
    maxlength?: Numeric
    /**
     * The minimum string length (measured in ) required that the user should enter.
     */
    minlength?: Numeric
    /**
     * The name of the control.
     */
    name?: string
    /**
     * A hint to the user of what can be entered in the control. Carriage returns or line-feeds within the placeholder text must be treated as line breaks when rendering the hint.
     * > [!NOTE]
     * > Placeholders should only be used to show an example of the type of data that should be entered into a form; they are _not_ a substitute for a proper  element tied to the input. See [`<input>` labels](/en-US/docs/Web/HTML/Reference/Elements/input#labels) for a full explanation.
     */
    placeholder?: string
    /**
     * This Boolean attribute indicates that the user cannot modify the value of the control. Unlike the `disabled` attribute, the `readonly` attribute does not prevent the user from clicking or selecting in the control. The value of a read-only control is still submitted with the form.
     */
    readonly?: string
    /**
     * This attribute specifies that the user must fill in a value before submitting a form.
     */
    required?: string
    /**
     * The number of visible text lines for the control. If it is specified, it must be a positive integer. If it is not specified, the default value is 2.
     */
    rows?: Numeric
    /**
     * Indicates how the control should wrap the value for form submission. Possible values are:
     */
    wrap?: string
}

