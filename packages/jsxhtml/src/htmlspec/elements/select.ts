import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'
import type {Numeric} from '../attributes/StandardGlobalAttributes'

export interface SelectAttributes extends CommonAttributes<ElementForTag<'select'>> {
    /**
     * A string providing a hint for a  autocomplete feature. See [The HTML autocomplete attribute](/en-US/docs/Web/HTML/Reference/Attributes/autocomplete) for a complete list of values and details on how to use autocomplete.
     */
    autocomplete?: string
    /**
     * This Boolean attribute indicates that the user cannot interact with the control. If this attribute is not specified, the control inherits its setting from the containing element, for example ; if there is no containing element with the `disabled` attribute set, then the control is enabled.
     */
    disabled?: string
    /**
     * The  element to associate the `<select>` with (its _form owner_). The value of this attribute must be the [`id`](/en-US/docs/Web/HTML/Reference/Global_attributes/id) of a `<form>` in the same document. (If this attribute is not set, the `<select>` is associated with its ancestor `<form>` element, if any.)
     * This attribute lets you associate `<select>` elements to `<form>`s anywhere in the document, not just inside a `<form>`. It can also override an ancestor `<form>` element.
     */
    form?: string
    /**
     * This Boolean attribute indicates that multiple options can be selected in the list. If it is not specified, then only one option can be selected at a time. When `multiple` is specified, most browsers will show a scrolling list box instead of a single line dropdown. Multiple selected options are submitted using the  array convention, i.e., `name=value1&name=value2`.
     */
    multiple?: string
    /**
     * This attribute is used to specify the name of the control.
     */
    name?: string
    /**
     * A Boolean attribute indicating that an option with a non-empty string value must be selected.
     */
    required?: string
    /**
     * If the control is presented as a scrolling list box (e.g., when `multiple` is specified), this attribute represents the number of rows in the list that should be visible at one time. Browsers are not required to present a select element as a scrolled list box. The default value is `0`.
     * > [!NOTE]
     * > According to the HTML specification, the default value for size should be `1`; however, in practice, this has been found to break some websites, and no other browser currently does that, so Mozilla has opted to continue to return `0` for the time being with Firefox.
     */
    size?: Numeric
}

