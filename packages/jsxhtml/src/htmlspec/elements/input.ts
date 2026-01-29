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
    // Obsolete
    | 'datetime'

/**
 * Type definition for the attributes of the HTML <input> element, excluding global attributes.
 * The <input> element is used to create interactive controls for web-based forms to accept data from the user.
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input
 */
export interface InputAttributes extends CommonAttributes<ElementForTag<'input'>> {
    /**
     * Valid for the `file` input type only, the `accept` attribute defines which file types are selectable in a `file` upload control. See the  input type.
     */
    accept?: string;

    /**
     * Valid for the `image` button only, the `alt` attribute provides alternative text for the image, displaying the value of the attribute if the image [`src`](#src) is missing or otherwise fails to load. See the  input type.
     */
    alt?: string;

    /**
     * (**Not** a Boolean attribute!) The [`autocomplete`](/en-US/docs/Web/HTML/Reference/Attributes/autocomplete) attribute takes as its value a space-separated string that describes what, if any, type of autocomplete functionality the input should provide. A typical implementation of autocomplete recalls previous values entered in the same input field, but more complex forms of autocomplete can exist. For instance, a browser could integrate with a device's contacts list to autocomplete `email` addresses in an email input field. See [`autocomplete`](/en-US/docs/Web/HTML/Reference/Attributes/autocomplete#value) for permitted values.
     * The `autocomplete` attribute is valid on `hidden`, `text`, `search`, `url`, `tel`, `email`, `date`, `month`, `week`, `time`, `datetime-local`, `number`, `range`, `color`, and `password`. This attribute has no effect on input types that do not return numeric or text data, being valid for all input types except `checkbox`, `radio`, `file`, or any of the button types.
     * See the [`autocomplete` attribute](/en-US/docs/Web/HTML/Reference/Attributes/autocomplete) for additional information, including information on password security and how `autocomplete` is slightly different for `hidden` than for other input types.
     */
    autocomplete?: string;

    /**
     * Introduced in the HTML Media Capture specification and valid for the `file` input type only, the `capture` attribute defines which media-microphone, video, or camera-should be used to capture a new file for upload with `file` upload control in supporting scenarios. See the  input type.
     */
    capture?: boolean | 'user' | 'environment';

    /**
     * Valid for both `radio` and `checkbox` types, `checked` is a Boolean attribute. If present on a `radio` type, it indicates that the radio button is the currently selected one in the group of same-named radio buttons. If present on a `checkbox` type, it indicates that the checkbox is checked by default (when the page loads). It does _not_ indicate whether this checkbox is currently checked: if the checkbox's state is changed, this content attribute does not reflect the change. (Only the [`HTMLInputElement`'s `checked` IDL attribute](/en-US/docs/Web/API/HTMLInputElement) is updated.)
     * > [!NOTE]
     * > Unlike other input controls, a checkboxes and radio buttons value are only included in the submitted data if they are currently `checked`. If they are, the name and the value(s) of the checked controls are submitted.
     * >
     * > For example, if a checkbox whose `name` is `fruit` has a `value` of `cherry`, and the checkbox is checked, the form data submitted will include `fruit=cherry`. If the checkbox isn't active, it isn't listed in the form data at all. The default `value` for checkboxes and radio buttons is `on`.
     */
    checked?: boolean;

    /**
     * Valid for `hidden`, `text`, `search`, `url`, `tel`, and `email` input types, the `dirname` attribute enables the submission of the directionality of the element. When included, the form control will submit with two name/value pairs: the first being the [`name`](#name) and [`value`](#value), and the second being the value of the `dirname` attribute as the name, with a value of `ltr` or `rtl` as set by the browser.
     * ```html
     * <form action="page.html" method="post">
     * <label>
     * Fruit:
     * <input type="text" name="fruit" dirname="fruit-dir" value="cherry" />
     * </label>
     * <input type="submit" />
     * </form>
     * <!-- page.html?fruit=cherry&fruit-dir=ltr -->
     * ```
     * When the form above is submitted, the input cause both the `name` / `value` pair of `fruit=cherry` and the `dirname` / direction pair of `fruit-dir=ltr` to be sent.
     * For more information, see the [`dirname` attribute](/en-US/docs/Web/HTML/Reference/Attributes/dirname).
     */
    dirname?: string;

    /**
     * A Boolean attribute which, if present, indicates that the user should not be able to interact with the input. Disabled inputs are typically rendered with a dimmer color or using some other form of indication that the field is not available for use.
     * Specifically, disabled inputs do not receive the  event, and disabled inputs are not submitted with the form.
     * > [!NOTE]
     * > Although not required by the specification, Firefox will by default [persist the dynamic disabled state](https://stackoverflow.com/questions/5985839/bug-with-firefox-disabled-attribute-of-input-not-resetting-when-refreshing) of an `<input>` across page loads. Use the [`autocomplete`](#autocomplete) attribute to control this feature.
     */
    disabled?: boolean;

    /**
     * A string specifying the  element with which the input is associated (that is, its **form owner**). This string's value, if present, must match the [`id`](#id) of a `<form>` element in the same document. If this attribute isn't specified, the `<input>` element is associated with the nearest containing form, if any.
     * The `form` attribute lets you place an input anywhere in the document but have it included with a form elsewhere in the document.
     * > [!NOTE]
     * > An input can only be associated with one form.
     */
    form?: string;

    /**
     * Valid for the `image` and `submit` input types only. See the  input type for more information.
     */
    formaction?: string;

    /**
     * Valid for the `image` and `submit` input types only. See the  input type for more information.
     */
    formenctype?: 'application/x-www-form-urlencoded' | 'multipart/form-data' | 'text/plain';

    /**
     * Valid for the `image` and `submit` input types only. See the  input type for more information.
     */
    formmethod?: 'get' | 'post';

    /**
     * Valid for the `image` and `submit` input types only. See the  input type for more information.
     */
    formnovalidate?: boolean;

    /**
     * Valid for the `image` and `submit` input types only. See the  input type for more information.
     */
    formtarget?: string;

    /**
     * Valid for the `image` input button only, the `height` is the height of the image file to display to represent the graphical submit button. See the  input type.
     */
    height?: Numeric;

    /**
     * The value given to the `list` attribute should be the  of a  element located in the same document. The `<datalist>` provides a list of predefined values to suggest to the user for this input. Any values in the list that are not compatible with the [`type`](#type) are not included in the suggested options. The values provided are suggestions, not requirements: users can select from this predefined list or provide a different value.
     * It is valid on `text`, `search`, `url`, `tel`, `email`, `date`, `month`, `week`, `time`, `datetime-local`, `number`, `range`, and `color`.
     * Per the specifications, the `list` attribute is not supported by the `hidden`, `password`, `checkbox`, `radio`, `file`, or any of the button types.
     * Depending on the browser, the user may see a custom color palette suggested, tic marks along a range, or even an input that opens like a  but allows for non-listed values. Check out the [browser compatibility table](/en-US/docs/Web/HTML/Reference/Elements/datalist#browser_compatibility) for the other input types.
     * See the  element.
     */
    list?: string;

    /**
     * Valid for `date`, `month`, `week`, `time`, `datetime-local`, `number`, and `range`, it defines the greatest value in the range of permitted values. If the [`value`](#value) entered into the element exceeds this, the element fails [constraint validation](/en-US/docs/Web/HTML/Guides/Constraint_validation). If the value of the `max` attribute isn't a number, then the element has no maximum value.
     * There is a special case: if the data type is periodic (such as for dates or times), the value of `max` may be lower than the value of `min`, which indicates that the range may wrap around; for example, this allows you to specify a time range from 10 PM to 4 AM.
     */
    max?: string | Numeric;

    /**
     * Valid for `text`, `search`, `url`, `tel`, `email`, and `password`, it defines the maximum string length (measured in ) that the user can enter into the field. This must be an integer value of 0 or higher. If no `maxlength` is specified, or an invalid value is specified, the field has no maximum length. This value must also be greater than or equal to the value of `minlength`.
     * The input will fail [constraint validation](/en-US/docs/Web/HTML/Guides/Constraint_validation) if the length of the text entered into the field is greater than `maxlength`  long. By default, browsers prevent users from entering more characters than allowed by the `maxlength` attribute. Constraint validation is only applied when the value is changed by the user. See [Client-side validation](#client-side_validation) for more information.
     */
    maxlength?: Numeric;

    /**
     * Valid for `date`, `month`, `week`, `time`, `datetime-local`, `number`, and `range`, it defines the most negative value in the range of permitted values. If the [`value`](#value) entered into the element is less than this, the element fails [constraint validation](/en-US/docs/Web/HTML/Guides/Constraint_validation). If the value of the `min` attribute isn't a number, then the element has no minimum value.
     * This value must be less than or equal to the value of the `max` attribute. If the `min` attribute is present but is not specified or is invalid, no `min` value is applied. If the `min` attribute is valid and a non-empty value is less than the minimum allowed by the `min` attribute, constraint validation will prevent form submission. See [Client-side validation](#client-side_validation) for more information.
     * There is a special case: if the data type is periodic (such as for dates or times), the value of `max` may be lower than the value of `min`, which indicates that the range may wrap around; for example, this allows you to specify a time range from 10 PM to 4 AM.
     */
    min?: string | Numeric;

    /**
     * Valid for `text`, `search`, `url`, `tel`, `email`, and `password`, it defines the minimum string length (measured in ) that the user can enter into the entry field. This must be a non-negative integer value smaller than or equal to the value specified by `maxlength`. If no `minlength` is specified, or an invalid value is specified, the input has no minimum length.
     * The input will fail [constraint validation](/en-US/docs/Web/HTML/Guides/Constraint_validation) if the length of the text entered into the field is fewer than `minlength`  long, preventing form submission. Constraint validation is only applied when the value is changed by the user. See [Client-side validation](#client-side_validation) for more information.
     */
    minlength?: Numeric;

    /**
     * The Boolean `multiple` attribute, if set, means the user can enter comma separated email addresses in the email widget or can choose more than one file with the `file` input. See the  and  input type.
     */
    multiple?: boolean;

    /**
     * A string specifying a name for the input control. This name is submitted along with the control's value when the form data is submitted.
     * Consider the `name` a required attribute (even though it's not). If an input has no `name` specified, or `name` is empty, the input's value is not submitted with the form! (Disabled controls, unchecked radio buttons, unchecked checkboxes, and reset buttons are also not sent.)
     * There are two special cases:
     * 1. `_charset_` : If used as the name of an `<input>` element of type , the input's `value` is automatically set by the  to the character encoding being used to submit the form.
     * 2. `isindex`: For historical reasons, the name [`isindex`](https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#attr-fe-name) is not allowed.
     * The [`name`](#name) attribute creates a unique behavior for radio buttons.
     * Only one radio button in a same-named group of radio buttons can be checked at a time. Selecting any radio button in that group automatically deselects any currently-selected radio button in the same group. The value of that one checked radio button is sent along with the name if the form is submitted,
     * When tabbing into a series of same-named group of radio buttons, if one is checked, that one will receive focus. If they aren't grouped together in source order, if one of the group is checked, tabbing into the group starts when the first one in the group is encountered, skipping all those that aren't checked. In other words, if one is checked, tabbing skips the unchecked radio buttons in the group. If none are checked, the radio button group receives focus when the first button in the same name group is reached.
     * Once one of the radio buttons in a group has focus, using the arrow keys will navigate through all the radio buttons of the same name, even if the radio buttons are not grouped together in the source order.
     * When an input element is given a `name`, that name becomes a property of the owning form element's  property. If you have an input whose `name` is set to `guest` and another whose `name` is `hat-size`, the following code can be used:
     * ```js
     * let form = document.querySelector("form");
     * let guestName = form.elements.guest;
     * let hatSize = form.elements["hat-size"];
     * ```
     * When this code has run, `guestName` will be the  for the `guest` field, and `hatSize` the object for the `hat-size` field.
     * > [!WARNING]
     * > Avoid giving form elements a `name` that corresponds to a built-in property of the form, since you would then override the predefined property or method with this reference to the corresponding input.
     */
    name?: string;

    /**
     * Valid for `text`, `search`, `url`, `tel`, `email`, and `password`, the `pattern` attribute is used to compile a regular expression that the input's [`value`](#value) must match in order for the value to pass [constraint validation](/en-US/docs/Web/HTML/Guides/Constraint_validation). It must be a valid JavaScript regular expression, as used by the  type, and as documented in our [guide on regular expressions](/en-US/docs/Web/JavaScript/Guide/Regular_expressions). No forward slashes should be specified around the pattern text. When compiling the regular expression:
     * 1. the pattern will be implicitly wrapped with `^(?:` and `)$`, such that the match is required against the _entire_ input value, i.e., `^(?:<pattern>)$`.
     * 2. the `'v'` flag is specified so that the pattern is treated as a sequence of Unicode code points, instead of as .
     * If the `pattern` attribute is present but is not specified or is invalid, no regular expression is applied and this attribute is ignored completely. If the pattern attribute is valid and a non-empty value does not match the pattern, constraint validation will prevent form submission. If the [`multiple`](/en-US/docs/Web/HTML/Reference/Attributes/multiple) is present, the compiled regular expression is matched against each comma separated value.
     * > [!NOTE]
     * > If using the `pattern` attribute, inform the user about the expected format by including explanatory text nearby. You can also include a [`title`](#title) attribute to explain what the requirements are to match the pattern; most browsers will display this title as a tooltip. The visible explanation is required for accessibility. The tooltip is an enhancement.
     * See [Client-side validation](#client-side_validation) for more information.
     */
    pattern?: string;

    /**
     * Valid for `text`, `search`, `url`, `tel`, `email`, `password`, and `number`, the `placeholder` attribute provides a brief hint to the user as to what kind of information is expected in the field. It should be a word or short phrase that provides a hint as to the expected type of data, rather than an explanation or prompt. The text _must not_ include carriage returns or line feeds. So for example if a field is expected to capture a user's first name, and its label is "First Name", a suitable placeholder might be "e.g., Mustafa".
     * > [!NOTE]
     * > The `placeholder` attribute is not as semantically useful as other ways to explain your form, and can cause unexpected technical issues with your content. See [Labels](#labels) for more information.
     */
    placeholder?: string;

    /**
     * Turns an `<input type="button">` element into a popover control button; takes the ID of the popover element to control as its value. See the  landing page for more details. Establishing a relationship between a popover and its invoker button using the `popovertarget` attribute has two additional useful effects:
     * - The browser creates an implicit [`aria-details`](/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-details) and [`aria-expanded`](/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-expanded) relationship between popover and invoker, and places the popover in a logical position in the keyboard focus navigation order when shown. This makes the popover more accessible to keyboard and assistive technology (AT) users (see also [Popover accessibility features](/en-US/docs/Web/API/Popover_API/Using#popover_accessibility_features)).
     * - The browser creates an implicit anchor reference between the two, making it very convenient to position popovers relative to their controls using [CSS anchor positioning](/en-US/docs/Web/CSS/Guides/Anchor_positioning). See [Popover anchor positioning](/en-US/docs/Web/API/Popover_API/Using#popover_anchor_positioning) for more details.
     */
    popovertarget?: string;

    /**
     * Specifies the action to be performed on a popover element being controlled by a control `<input type="button">`. Possible values are:
     */
    popovertargetaction?: 'show' | 'hide' | 'toggle';

    /**
     * A Boolean attribute which, if present, indicates that the user should not be able to edit the value of the input. The `readonly` attribute is supported by the `text`, `search`, `url`, `tel`, `email`, `date`, `month`, `week`, `time`, `datetime-local`, `number`, and `password` input types.
     * See the [HTML attribute: `readonly`](/en-US/docs/Web/HTML/Reference/Attributes/readonly) for more information.
     */
    readonly?: boolean;

    /**
     * `required` is a Boolean attribute which, if present, indicates that the user must specify a value for the input before the owning form can be submitted. The `required` attribute is supported by `text`, `search`, `url`, `tel`, `email`, `date`, `month`, `week`, `time`, `datetime-local`, `number`, `password`, `checkbox`, `radio`, and `file` inputs.
     * See [Client-side validation](#client-side_validation) and the [HTML attribute: `required`](/en-US/docs/Web/HTML/Reference/Attributes/required) for more information.
     */
    required?: boolean;

    /**
     * Valid for `email`, `password`, `tel`, `url`, and `text`, the `size` attribute specifies how much of the input is shown. Basically creates same result as setting CSS  property with a few specialties. The actual unit of the value depends on the input type. For `password` and `text`, it is a number of characters (or `em` units) with a default value of `20`, and for others, it is pixels (or `px` units). CSS `width` takes precedence over the `size` attribute.
     */
    size?: Numeric;

    /**
     * Valid for the `image` input button only, the `src` is string specifying the URL of the image file to display to represent the graphical submit button. See the  input type.
     */
    src?: string;

    /**
     * - Each date/time input type has a default `step` value appropriate for the type; see the individual input pages: [`date`](/en-US/docs/Web/HTML/Reference/Elements/input/date#step), [`datetime-local`](/en-US/docs/Web/HTML/Reference/Elements/input/datetime-local#step), [`month`](/en-US/docs/Web/HTML/Reference/Elements/input/month#step), [`time`](/en-US/docs/Web/HTML/Reference/Elements/input/time#step), and [`week`](/en-US/docs/Web/HTML/Reference/Elements/input/week#step).
     * The value must be a positive number-integer or float-or the special value `any`, which means no stepping is implied, and any value is allowed (barring other constraints, such as [`min`](/en-US/docs/Web/HTML/Reference/Attributes/min) and [`max`](/en-US/docs/Web/HTML/Reference/Attributes/max)).
     * For example, if you have `<input type="number" min="10" step="2">`, then any even integer, `10` or greater, is valid. If omitted, `<input type="number">`, any integer is valid, but floats (like `4.2`) are not valid, because `step` defaults to `1`. For `4.2` to be valid, `step` would have had to be set to `any`, 0.1, 0.2, or the `min` value would have had to be a number ending in `.2`, such as `<input type="number" min="-5.2">`.
     * > [!NOTE]
     * > When the data entered by the user doesn't adhere to the stepping configuration, the value is considered invalid in constraint validation and will match the `:invalid` pseudoclass.
     * See [Client-side validation](#client-side_validation) for more information.
     */
    step?: Numeric | 'any';

    /**
     * A string specifying the type of control to render. For example, to create a checkbox, a value of `checkbox` is used. If omitted (or an unknown value is specified), the input type `text` is used, creating a plaintext input field.
     * Permitted values are listed in [Input types](#input_types) above.
     */
    type?: InputType;

    /**
     * The input control's value. When specified in the HTML, this is the initial value, and from then on it can be altered or retrieved at any time using JavaScript to access the respective  object's `value` property. The `value` attribute is always optional, though should be considered mandatory for `checkbox`, `radio`, and `hidden`.
     */
    value?: string | Numeric;

    /**
     * Valid for the `image` input button only, the `width` is the width of the image file to display to represent the graphical submit button. See the  input type.
     */
    width?: Numeric;

    // --- Non-standard attributes ---

    /**
     * The Boolean attribute `incremental` is a WebKit and Blink extension (so supported by Safari, Opera, Chrome, etc.) which, if present, tells the  to process the input as a live search. As the user edits the value of the field, the user agent sends  events to the  object representing the search box. This allows your code to update the search results in real time as the user edits the search.
     * If `incremental` is not specified, the  event is only sent when the user explicitly initiates a search (such as by pressing the <kbd>Enter</kbd> or <kbd>Return</kbd> key while editing the field).
     * The `search` event is rate-limited so that it is not sent more frequently than an implementation-defined interval.
     */
    incremental?: boolean;

    /**
     * Similar to the -moz-orient non-standard CSS property impacting the  and  elements, the `orient` attribute defines the orientation of the range slider. Values include `horizontal`, meaning the range is rendered horizontally, and `vertical`, where the range is rendered vertically. See [Creating vertical form controls](/en-US/docs/Web/CSS/Guides/Writing_modes/Vertical_controls) for a modern approach to creating vertical form controls.
     */
    orient?: 'horizontal' | 'vertical';

    /**
     * The `results` attribute-supported only by Safari-is a numeric value that lets you override the maximum number of entries to be displayed in the `<input>` element's natively-provided drop-down menu of previous search queries.
     * The value must be a non-negative decimal number. If not provided, or an invalid value is given, the browser's default maximum number of entries is used.
     */
    results?: number;

    /**
     * The Boolean `webkitdirectory` attribute, if present, indicates that only directories should be available to be selected by the user in the file picker interface. See  for additional details and examples.
     * Though originally implemented only for WebKit-based browsers, `webkitdirectory` is also usable in Microsoft Edge as well as Firefox 50 and later. However, even though it has relatively broad support, it is still not standard and should not be used unless you have no alternative.
     */
    webkitdirectory?: boolean;
    /**
     * Valid for the `color` input type only, the `alpha` attribute provides the end user with the ability to set the opacity of the color being selected.
     */
    alpha?: string
    /**
     * Valid for the `color` input type only, the `colorspace` attribute specifies the [color space](/en-US/docs/Glossary/Color_space) that is used by the `type="color"` input. Possible  values are:
     */
    colorspace?: string
}

