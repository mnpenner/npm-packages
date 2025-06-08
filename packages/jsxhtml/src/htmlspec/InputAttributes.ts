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
    | 'datetime';

/**
 * Type definition for the attributes of the HTML <input> element, excluding global attributes.
 * The <input> element is used to create interactive controls for web-based forms to accept data from the user.
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input
 */
export type InputAttributes = {
    /**
     * Specifies the types of files that the server accepts (that can be submitted through a file upload).
     * Valid for the `file` input type only.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#accept
     */
    accept?: string;

    /**
     * Provides alternative text for the image, displaying if the image `src` is missing or fails to load.
     * Valid for the `image` input type only.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#alt
     */
    alt?: string;

    /**
     * A string that describes what, if any, type of autocomplete functionality the input should provide.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#autocomplete
     */
    autocomplete?: string;

    /**
     * Defines which media (microphone, video, or camera) should be used to capture a new file for upload.
     * Valid for the `file` input type only.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#capture
     */
    capture?: boolean | 'user' | 'environment';

    /**
     * Indicates whether a control is checked by default (when the page loads).
     * Valid for `radio` and `checkbox` types.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#checked
     */
    checked?: boolean;

    /**
     * Enables the submission of the directionality of the element, and specifies the name of the field that will contain this value.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#dirname
     */
    dirname?: string;

    /**
     * Indicates that the user should not be able to interact with the input.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#disabled
     */
    disabled?: boolean;

    /**
     * The ID of the `<form>` element with which the input is associated.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#form
     */
    form?: string;

    /**
     * The URL that processes the information submitted by the input. Overrides the `action` attribute of the parent form.
     * Valid for `image` and `submit` types.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#formaction
     */
    formaction?: string;

    /**
     * Specifies the encoding of the form data when the form is submitted. Overrides the `enctype` of the parent form.
     * Valid for `image` and `submit` types.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#formenctype
     */
    formenctype?: 'application/x-www-form-urlencoded' | 'multipart/form-data' | 'text/plain';

    /**
     * The HTTP method to use for form submission. Overrides the `method` of the parent form.
     * Valid for `image` and `submit` types.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#formmethod
     */
    formmethod?: 'get' | 'post';

    /**
     * If present, bypasses form control validation for form submission. Overrides the `novalidate` of the parent form.
     * Valid for `image` and `submit` types.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#formnovalidate
     */
    formnovalidate?: boolean;

    /**
     * Specifies the browsing context for form submission. Overrides the `target` of the parent form.
     * Valid for `image` and `submit` types.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#formtarget
     */
    formtarget?: string;

    /**
     * The height of the image file to display for a graphical submit button.
     * Valid for the `image` input type only.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#height
     */
    height?: string | number;

    /**
     * The ID of a `<datalist>` element located in the same document to provide a list of predefined values to suggest for this input.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#list
     */
    list?: string;

    /**
     * The greatest value in the range of permitted values.
     * Valid for `date`, `month`, `week`, `time`, `datetime-local`, `number`, and `range`.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#max
     */
    max?: string | number;

    /**
     * The maximum string length (in UTF-16 code units) that the user can enter.
     * Valid for `text`, `search`, `url`, `tel`, `email`, and `password`.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#maxlength
     */
    maxlength?: number;

    /**
     * The most negative value in the range of permitted values.
     * Valid for `date`, `month`, `week`, `time`, `datetime-local`, `number`, and `range`.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#min
     */
    min?: string | number;

    /**
     * The minimum string length (in UTF-16 code units) that the user can enter.
     * Valid for `text`, `search`, `url`, `tel`, `email`, and `password`.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#minlength
     */
    minlength?: number;

    /**
     * If present, the user can enter multiple values.
     * Valid for `email` and `file` types.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#multiple
     */
    multiple?: boolean;

    /**
     * The name of the input control. This name is submitted along with the control's value when the form is submitted.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#name
     */
    name?: string;

    /**
     * A regular expression that the input's value must match for the value to pass constraint validation.
     * Valid for `text`, `search`, `url`, `tel`, `email`, and `password`.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#pattern
     */
    pattern?: string;

    /**
     * A brief hint to the user as to what kind of information is expected in the field.
     * Valid for `text`, `search`, `url`, `tel`, `email`, `password`, and `number`.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#placeholder
     */
    placeholder?: string;

    /**
     * Designates an `<input type="button">` as a control for a popover element, taking the ID of the popover.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#popovertarget
     */
    popovertarget?: string;

    /**
     * Specifies the action ('show', 'hide', or 'toggle') that a popover control button should perform.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#popovertargetaction
     */
    popovertargetaction?: 'show' | 'hide' | 'toggle';

    /**
     * If present, indicates that the user should not be able to edit the value of the input.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#readonly
     */
    readonly?: boolean;

    /**
     * If present, indicates that the user must specify a value for the input before the owning form can be submitted.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#required
     */
    required?: boolean;

    /**
     * The visible size of the control, in characters for text/password, or pixels for others.
     * Valid for `email`, `password`, `tel`, `url`, and `text`.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#size
     */
    size?: number;

    /**
     * The URL of the image file to display for the graphical submit button.
     * Valid for the `image` input type only.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#src
     */
    src?: string;

    /**
     * A number that specifies the granularity that the value must adhere to, or the special value "any".
     * Valid for `date`, `month`, `week`, `time`, `datetime-local`, `number`, and `range`.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#step
     */
    step?: number | 'any';

    /**
     * The type of control to render. If omitted, the default is `text`.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#type
     */
    type?: InputType;

    /**
     * The input control's value. When specified in the HTML, this is the initial value.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#value
     */
    value?: string | number | readonly string[];

    /**
     * The width of the image file to display for the graphical submit button.
     * Valid for the `image` input type only.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#width
     */
    width?: string | number;

    // --- Non-standard attributes ---

    /**
     * If present, tells the user agent to process the input as a live search.
     * @nonstandard
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#incremental
     */
    incremental?: boolean;

    /**
     * Defines the orientation of the range slider.
     * @nonstandard This is a Firefox-only attribute.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#orient
     */
    orient?: 'horizontal' | 'vertical';

    /**
     * Overrides the maximum number of entries to be displayed in the dropdown menu of previous search queries.
     * @nonstandard This is a Safari-only attribute.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#results
     */
    results?: number;

    /**
     * If present, indicates that only directories should be available to be selected by the user in the file picker interface.
     * @nonstandard
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#webkitdirectory
     */
    webkitdirectory?: boolean;
};
