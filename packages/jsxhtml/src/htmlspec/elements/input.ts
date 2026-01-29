import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'
import type {Numeric} from '../attributes/StandardGlobalAttributes'

/**
 * A union of all possible 'type' attribute values for the <input> element.
 */
export type InputType =
    | 'button'
    | 'checkbox'
    | 'color'
    | 'date'
    | 'datetime-local'
    | 'email'
    | 'file'
    | 'hidden'
    | 'image'
    | 'month'
    | 'number'
    | 'password'
    | 'radio'
    | 'range'
    | 'reset'
    | 'search'
    | 'submit'
    | 'tel'
    | 'text'
    | 'time'
    | 'url'
    | 'week'

/**
 * Type definition for the attributes of the HTML <input> element, excluding global attributes.
 * The <input> element is used to create interactive controls for web-based forms to accept data from the user.
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input
 */
export interface InputAttributes extends CommonAttributes<ElementForTag<'input'>> {
    /**
     * The **`accept`** attribute takes as its value a comma-separated list of one or more file types, or unique file type specifiers, describing which file types to allow.
     */
    accept?: string;

    /**
     * Valid for the `image` button only, the `alt` attribute provides alternative text for the image, displaying the value of the attribute if the image `src` is missing or otherwise fails to load. See the image input type.
     */
    alt?: string;

    /**
     * Controls whether the browser may automatically complete the value and provides guidance about the type of information expected in the field.
     *
     * Possible values:
     * - off
     * - on
     */
    autocomplete?: 'on' | 'off' | string;

    /**
     * The **`capture`** attribute specifies that, optionally, a new file should be captured, and which device should be used to capture that new media of a type defined by the `accept` attribute.
     */
    capture?: boolean | 'user' | 'environment';

    /**
     * Valid for both `radio` and `checkbox` types, `checked` is a Boolean attribute. If present on a `radio` type, it indicates that the radio button is the currently selected one in the group of same-named radio buttons. If present on a `checkbox` type, it indicates that the checkbox is checked by default (when the page loads). It does _not_ indicate whether this checkbox is currently checked: if the checkbox's state is changed, this content attribute does not reflect the change. (Only the `HTMLInputElement`'s `checked` IDL attribute is updated.)
     */
    checked?: boolean;

    /**
     * The **`dirname`** attribute can be used on the textarea element and several input types and describes the directionality of the element's text content during form submission. The browser uses this attribute's value to determine whether text the user has entered is left-to-right or right-to-left oriented. When used, the element's text directionality value is included in form submission data along with the `dirname` attribute's value as the name of the field.
     */
    dirname?: string;

    /**
     * The Boolean **`disabled`** attribute, when present, makes the element not mutable, focusable, or even submitted with the form. The user can neither edit nor focus on the control, nor its form control descendants.
     */
    disabled?: boolean;

    /**
     * The `form` HTML attribute associates a form-associated element with a form element within the same document. This attribute applies to the button, fieldset, input, object, output, select, and textarea elements.
     */
    form?: string;

    /**
     * Valid for the `image` and `submit` input types only. See the submit input type for more information.
     */
    formaction?: string;

    /**
     * Valid for the `image` and `submit` input types only. See the submit input type for more information.
     */
    formenctype?: 'application/x-www-form-urlencoded' | 'multipart/form-data' | 'text/plain';

    /**
     * Valid for the `image` and `submit` input types only. See the submit input type for more information.
     */
    formmethod?: 'get' | 'post';

    /**
     * Valid for the `image` and `submit` input types only. See the submit input type for more information.
     */
    formnovalidate?: boolean;

    /**
     * Valid for the `image` and `submit` input types only. See the submit input type for more information.
     */
    formtarget?: string;

    /**
     * Valid for the `image` input button only, the `height` is the height of the image file to display to represent the graphical submit button. See the image input type.
     */
    height?: Numeric;

    /**
     * The value given to the `list` attribute should be the id of a datalist element located in the same document. The `<datalist ` provides a list of predefined values to suggest to the user for this input. Any values in the list that are not compatible with the `type` are not included in the suggested options. The values provided are suggestions, not requirements: users can select from this predefined list or provide a different value. It is valid on `text`, `search`, `url`, `tel`, `email`, `date`, `month`, `week`, `time`, `datetime-local`, `number`, `range`, and `color`. Per the specifications, the `list` attribute is not supported by the `hidden`, `password`, `checkbox`, `radio`, `file`, or any of the button types. Depending on the browser, the user may see a custom color palette suggested, tic marks along a range, or even an input that opens like a select but allows for non-listed values. Check out the browser compatibility table for the other input types. See the datalist element.
     */
    list?: string;

    /**
     * The **`max`** attribute defines the maximum value that is acceptable and valid for the input containing the attribute. If the `value` of the element is greater than this, the element fails validation. This value must be greater than or equal to the value of the `min` attribute. If the `max` attribute is present but is not specified or is invalid, no `max` value is applied. If the `max` attribute is valid and a non-empty value is greater than the maximum allowed by the `max` attribute, constraint validation will prevent form submission.
     */
    max?: string | Numeric;

    /**
     * The **`maxlength`** attribute defines the maximum string length that the user can enter into an input or textarea. The attribute must have an integer value of 0 or higher.
     */
    maxlength?: Numeric;

    /**
     * The **`min`** attribute defines the minimum value that is acceptable and valid for the input containing the attribute. If the `value` of the element is less than this, the element fails validation. This value must be less than or equal to the value of the `max` attribute.
     */
    min?: string | Numeric;

    /**
     * The **`minlength`** attribute defines the minimum string length that the user can enter into an input or textarea. The attribute must have an integer value of 0 or higher.
     */
    minlength?: Numeric;

    /**
     * The Boolean **`multiple`** attribute, if set, means the form control accepts one or more values. The attribute is valid for the email and file input types and the select. The manner by which the user opts for multiple values depends on the form control.
     */
    multiple?: boolean;

    /**
     * A string specifying a name for the input control. This name is submitted along with the control's value when the form data is submitted. Consider the `name` a required attribute (even though it's not). If an input has no `name` specified, or `name` is empty, the input's value is not submitted with the form! (Disabled controls, unchecked radio buttons, unchecked checkboxes, and reset buttons are also not sent.) There are two special cases: 1. `_charset_` : If used as the name of an `<input ` element of type hidden, the input's `value` is automatically set by the user agent to the character encoding being used to submit the form. 2. `isindex`: For historical reasons, the name `isindex` is not allowed. The `name` attribute creates a unique behavior for radio buttons. Only one radio button in a same-named group of radio buttons can be checked at a time. Selecting any radio button in that group automatically deselects any currently-selected radio button in the same group. The value of that one checked radio button is sent along with the name if the form is submitted, When tabbing into a series of same-named group of radio buttons, if one is checked, that one will receive focus. If they aren't grouped together in source order, if one of the group is checked, tabbing into the group starts when the first one in the group is encountered, skipping all those that aren't checked. In other words, if one is checked, tabbing skips the unchecked radio buttons in the group. If none are checked, the radio button group receives focus when the first button in the same name group is reached. Once one of the radio buttons in a group has focus, using the arrow keys will navigate through all the radio buttons of the same name, even if the radio buttons are not grouped together in the source order. When an input element is given a `name`, that name becomes a property of the owning form element's HTMLFormElement.elements property. If you have an input whose `name` is set to `guest` and another whose `name` is `hat-size`, the following code can be used:
     */
    name?: string;

    /**
     * The **`pattern`** attribute specifies a regular expression the form control's value should match. If a non-`null` value doesn't conform to the constraints set by the `pattern` value, the ValidityState object's read-only patternMismatch property will be true.
     */
    pattern?: string;

    /**
     * The **`placeholder`** attribute defines the text displayed in a form control when the control has no value. The placeholder text should provide a brief hint to the user as to the expected type of data that should be entered into the control.
     */
    placeholder?: string;

    /**
     * Turns an `<input type="button" ` element into a popover control button; takes the ID of the popover element to control as its value. See the Popover API landing page for more details. Establishing a relationship between a popover and its invoker button using the `popovertarget` attribute has two additional useful effects:
     */
    popovertarget?: string;

    /**
     * Specifies the action to be performed on a popover element being controlled by a control `<input type="button" `. Possible values are: The button will hide a shown popover. If you try to hide an already hidden popover, no action will be taken. The button will show a hidden popover. If you try to show an already showing popover, no action will be taken. The button will toggle a popover between showing and hidden. If the popover is hidden, it will be shown; if the popover is showing, it will be hidden. If `popovertargetaction` is omitted, `"toggle"` is the default action that will be performed by the control button.
     *
     * Possible values:
     * - hide
     * - show
     * - toggle
     */
    popovertargetaction?: 'hide' | 'show' | 'toggle'

    /**
     * The Boolean **`readonly`** attribute, when present, makes the element not mutable, meaning the user can not edit the control.
     */
    readonly?: boolean;

    /**
     * The Boolean **`required`** attribute, if present, indicates that the user must specify a value for the input before the owning form can be submitted.
     */
    required?: boolean;

    /**
     * The **`size`** attribute defines the width of the input and the height of the select element. For an `input` element, it defines the number of characters that the user agent allows the user to see when editing the value. For a `select` element, it defines the number of options that should be shown to the user. This must be a valid non-negative integer greater than zero.
     */
    size?: Numeric;

    /**
     * Valid for the `image` input button only, the `src` is string specifying the URL of the image file to display to represent the graphical submit button. See the image input type.
     */
    src?: string;

    /**
     * The **`step`** attribute is a number that specifies the granularity that the value must adhere to or the keyword `any`. It is valid for the numeric input types, including the date, month, week, time, datetime-local, number and range types.
     */
    step?: Numeric | 'any';

    /**
     * A string specifying the type of control to render. For example, to create a checkbox, a value of `checkbox` is used. If omitted (or an unknown value is specified), the input type `text` is used, creating a plaintext input field. Permitted values are listed in Input types above.
     */
    type?: InputType;

    /**
     * The input control's value. When specified in the HTML, this is the initial value, and from then on it can be altered or retrieved at any time using JavaScript to access the respective HTMLInputElement object's `value` property. The `value` attribute is always optional, though should be considered mandatory for `checkbox`, `radio`, and `hidden`.
     */
    value?: string | Numeric;

    /**
     * Valid for the `image` input button only, the `width` is the width of the image file to display to represent the graphical submit button. See the image input type.
     */
    width?: Numeric;

    // --- Non-standard attributes ---

    /**
     * The Boolean attribute `incremental` is a WebKit and Blink extension (so supported by Safari, Opera, Chrome, etc.) which, if present, tells the user agent to process the input as a live search. As the user edits the value of the field, the user agent sends search events to the HTMLInputElement object representing the search box. This allows your code to update the search results in real time as the user edits the search. If `incremental` is not specified, the search event is only sent when the user explicitly initiates a search (such as by pressing the <kbd Enter</kbd or <kbd Return</kbd key while editing the field). The `search` event is rate-limited so that it is not sent more frequently than an implementation-defined interval.
     * @experimental
     */
    incremental?: boolean;

    /**
     * Similar to the -moz-orient non-standard CSS property impacting the progress and meter elements, the `orient` attribute defines the orientation of the range slider. Values include `horizontal`, meaning the range is rendered horizontally, and `vertical`, where the range is rendered vertically. See Creating vertical form controls for a modern approach to creating vertical form controls.
     * @experimental
     */
    orient?: 'horizontal' | 'vertical';

    /**
     * The `results` attribute-supported only by Safari-is a numeric value that lets you override the maximum number of entries to be displayed in the `<input ` element's natively-provided drop-down menu of previous search queries. The value must be a non-negative decimal number. If not provided, or an invalid value is given, the browser's default maximum number of entries is used.
     * @experimental
     */
    results?: Numeric;

    /**
     * The Boolean `webkitdirectory` attribute, if present, indicates that only directories should be available to be selected by the user in the file picker interface. See HTMLInputElement.webkitdirectory for additional details and examples. Though originally implemented only for WebKit-based browsers, `webkitdirectory` is also usable in Microsoft Edge as well as Firefox 50 and later. However, even though it has relatively broad support, it is still not standard and should not be used unless you have no alternative.
     * @experimental
     */
    webkitdirectory?: boolean;
    /**
     * Valid for the `color` input type only, the `alpha` attribute provides the end user with the ability to set the opacity of the color being selected.
     * @experimental
     */
    alpha?: boolean
    /**
     * Valid for the `color` input type only, the `colorspace` attribute specifies the color space that is used by the `type="color"` input. Possible enumerated values are:
     *
     * Possible values:
     * - limited-srgb
     * - display-p3
     * @experimental
     */
    colorspace?: 'limited-srgb' | 'display-p3'

}
