import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'
import type {Numeric} from '../attributes/StandardGlobalAttributes'

/**
 * All standard attributes for the `<button>` HTML element.
 */
export interface ButtonAttributes extends CommonAttributes<ElementForTag<'button'>> {
    /**
     * This Boolean attribute specifies that the button should have input [focus](/en-US/docs/Web/API/HTMLElement/focus) when the page loads. **Only one element in a document can have this attribute.**
     */
    autofocus?: boolean

    /**
     * Specifies the action to be performed on an element being controlled by a control `<button>` specified via the `commandfor` attribute. The possible values are:
     */
    command?: string

    /**
     * Turns a `<button>` element into a command button, controlling a given interactive element by issuing the command specified in the button's [`command`](#command) attribute. The `commandfor` attribute takes the ID of the element to control as its value. This is a more general version of [`popovertarget`](#popovertarget).
     */
    commandfor?: string

    /**
     * This Boolean attribute prevents the user from interacting with the button: it cannot be pressed or focused.
     */
    disabled?: boolean

    /**
     * The  element to associate the button with (its _form owner_). The value of this attribute must be the `id` of a `<form>` in the same document. (If this attribute is not set, the `<button>` is associated with its ancestor `<form>` element, if any.)
     * This attribute lets you associate `<button>` elements to `<form>`s anywhere in the document, not just inside a `<form>`. It can also override an ancestor `<form>` element.
     */
    form?: string

    /**
     * The URL that processes the information submitted by the button. Overrides the [`action`](/en-US/docs/Web/HTML/Reference/Elements/form#action) attribute of the button's form owner. Does nothing if there is no form owner.
     */
    formaction?: string

    /**
     * If the button is a submit button (it's inside/associated with a `<form>` and doesn't have `type="button"`), specifies how to encode the form data that is submitted. Possible values:
     */
    formenctype?: 'application/x-www-form-urlencoded' | 'multipart/form-data' | 'text/plain'

    /**
     * If the button is a submit button (it's inside/associated with a `<form>` and doesn't have `type="button"`), this attribute specifies the [HTTP method](/en-US/docs/Web/HTTP/Reference/Methods) used to submit the form. Possible values:
     */
    formmethod?: 'get' | 'post' | 'dialog'

    /**
     * If the button is a submit button, this Boolean attribute specifies that the form is not to be [validated](/en-US/docs/Learn_web_development/Extensions/Forms/Form_validation) when it is submitted. If this attribute is specified, it overrides the [`novalidate`](/en-US/docs/Web/HTML/Reference/Elements/form#novalidate) attribute of the button's form owner.
     * This attribute is also available on [`<input type="image">`](/en-US/docs/Web/HTML/Reference/Elements/input/image) and [`<input type="submit">`](/en-US/docs/Web/HTML/Reference/Elements/input/submit) elements.
     */
    formnovalidate?: boolean

    /**
     * If the button is a submit button, this attribute is an author-defined name or standardized, underscore-prefixed keyword indicating where to display the response from submitting the form. This is the `name` of, or keyword for, a _browsing context_ (a tab, window, or ). If this attribute is specified, it overrides the [`target`](/en-US/docs/Web/HTML/Reference/Elements/form#target) attribute of the button's form owner. The following keywords have special meanings:
     */
    formtarget?: string

    /**
     * Defines the `<button>` element as an **interest invoker**. Its value is the `id` of a target element, which will be affected in some way (normally shown or hidden) when interest is shown or lost on the invoker element (for example, by hovering/unhovering or focusing/blurring it). See [Using interest invokers](/en-US/docs/Web/API/Popover_API/Using_interest_invokers) for more details and examples.
     */
    interestfor?: string

    /**
     * The name of the button, submitted as a pair with the button's `value` as part of the form data, when that button is used to submit the form.
     */
    name?: string

    /**
     * Turns a `<button>` element into a popover control button; takes the ID of the popover element to control as its value. Establishing a relationship between a popover and its invoker button using the `popovertarget` attribute has two additional useful effects:
     * - The browser creates an implicit [`aria-details`](/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-details) and [`aria-expanded`](/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-expanded) relationship between popover and invoker, and places the popover in a logical position in the keyboard focus navigation order when shown. This makes the popover more accessible to keyboard and assistive technology (AT) users (see also [Popover accessibility features](/en-US/docs/Web/API/Popover_API/Using#popover_accessibility_features)).
     * - The browser creates an implicit anchor reference between the two, making it very convenient to position popovers relative to their controls using [CSS anchor positioning](/en-US/docs/Web/CSS/Guides/Anchor_positioning). See [Popover anchor positioning](/en-US/docs/Web/API/Popover_API/Using#popover_anchor_positioning) for more details.
     */
    popovertarget?: string

    /**
     * Specifies the action to be performed on a popover element being controlled by a control `<button>`. Possible values are:
     */
    popovertargetaction?: 'show' | 'hide' | 'toggle'

    /**
     * The default behavior of the button. Possible values are:
     */
    type?: 'submit' | 'reset' | 'button'

    /**
     * Defines the value associated with the button's `name` when it's submitted with the form data. This value is passed to the server in params when the form is submitted using this button.
     */
    value?: string | Numeric
}

