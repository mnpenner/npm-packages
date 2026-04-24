import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'
import type {Numeric} from '../attributes/StandardGlobalAttributes'

/**
 * All standard attributes for the `<button>` HTML element.
 */
export interface ButtonAttributes extends CommonAttributes<ElementForTag<'button'>> {

    /**
     * Specifies the action to be performed on an element being controlled by a control `<button ` specified via the `commandfor` attribute. The possible values are: The button will show a dialog as modal. If the dialog is already modal, no action will be taken. This is a declarative equivalent of calling the HTMLDialogElement.showModal() method on the `<dialog ` element. The button will close a dialog element. If the dialog is already closed, no action will be taken. This is a declarative equivalent of calling the HTMLDialogElement.close() method on the `<dialog ` element. The button will trigger a cancel event on a dialog element to request that the browser dismiss it, followed by a close event. This differs from the `close` command in that authors can call Event.preventDefault() on the `cancel` event to prevent the `<dialog ` from closing. If the dialog is already closed, no action will be taken. This is a declarative equivalent of calling the HTMLDialogElement.requestClose() method on the `<dialog ` element. The button will show a hidden popover. If you try to show an already showing popover, no action will be taken. See Popover API for more details. This is equivalent to setting a value of `show` for the `popovertargetaction` attribute, and also provides a declarative equivalent to calling the HTMLElement.showPopover() method on the popover element. The button will hide a showing popover. If you try to hide an already hidden popover, no action will be taken. See Popover API for more details. This is equivalent to setting a value of `hide` for the `popovertargetaction` attribute, and also provides a declarative equivalent to calling the HTMLElement.hidePopover() method on the popover element. The button will toggle a popover between showing and hidden. If the popover is hidden, it will be shown; if the popover is showing, it will be hidden. See Popover API for more details. This is equivalent to setting a value of `toggle` for the `popovertargetaction` attribute, and also provides a declarative equivalent to calling the HTMLElement.togglePopover() method on the popover element. This attribute can represent custom values that are prefixed with a two hyphen characters (`--`). Buttons with a custom value will dispatch the CommandEvent on the controlled element.
     *
     * Possible values:
     * - "show-modal"
     * - "close"
     * - "request-close"
     * - "show-popover"
     * - "hide-popover"
     * - "toggle-popover"
     */
    command?: '"show-modal"' | '"close"' | '"request-close"' | '"show-popover"' | '"hide-popover"' | '"toggle-popover"'

    /**
     * Turns a `<button ` element into a command button, controlling a given interactive element by issuing the command specified in the button's `command` attribute. The `commandfor` attribute takes the ID of the element to control as its value. This is a more general version of `popovertarget`.
     */
    commandfor?: string

    /**
     * The Boolean **`disabled`** attribute, when present, makes the element not mutable, focusable, or even submitted with the form. The user can neither edit nor focus on the control, nor its form control descendants.
     */
    disabled?: boolean

    /**
     * The `form` HTML attribute associates a form-associated element with a form element within the same document. This attribute applies to the button, fieldset, input, object, output, select, and textarea elements.
     */
    form?: string

    /**
     * The URL that processes the information submitted by the button. Overrides the `action` attribute of the button's form owner. Does nothing if there is no form owner.
     */
    formaction?: string

    /**
     * If the button is a submit button (it's inside/associated with a `<form ` and doesn't have `type="button"`), specifies how to encode the form data that is submitted. Possible values: If this attribute is specified, it overrides the `enctype` attribute of the button's form owner.
     *
     * Possible values:
     * - application/x-www-form-urlencoded
     * - multipart/form-data
     * - text/plain
     */
    formenctype?: 'application/x-www-form-urlencoded' | 'multipart/form-data' | 'text/plain'

    /**
     * If the button is a submit button (it's inside/associated with a `<form ` and doesn't have `type="button"`), this attribute specifies the HTTP method used to submit the form. Possible values: If specified, this attribute overrides the `method` attribute of the button's form owner.
     *
     * Possible values:
     * - post
     * - get
     * - dialog
     */
    formmethod?: 'post' | 'get' | 'dialog'

    /**
     * If the button is a submit button, this Boolean attribute specifies that the form is not to be validated when it is submitted. If this attribute is specified, it overrides the `novalidate` attribute of the button's form owner. This attribute is also available on `<input type="image" ` and `<input type="submit" ` elements.
     */
    formnovalidate?: boolean

    /**
     * If the button is a submit button, this attribute is an author-defined name or standardized, underscore-prefixed keyword indicating where to display the response from submitting the form. This is the `name` of, or keyword for, a _browsing context_ (a tab, window, or iframe). If this attribute is specified, it overrides the `target` attribute of the button's form owner. The following keywords have special meanings:
     *
     * Possible values:
     * - _self
     * - _blank
     * - _parent
     * - _top
     */
    formtarget?: '_self' | '_blank' | '_parent' | '_top'

    /**
     * Defines the `<button ` element as an **interest invoker**. Its value is the `id` of a target element, which will be affected in some way (normally shown or hidden) when interest is shown or lost on the invoker element (for example, by hovering/unhovering or focusing/blurring it). See Using interest invokers for more details and examples.
     * @experimental
     */
    interestfor?: string

    /**
     * The name of the button, submitted as a pair with the button's `value` as part of the form data, when that button is used to submit the form.
     */
    name?: string

    /**
     * Turns a `<button ` element into a popover control button; takes the ID of the popover element to control as its value. Establishing a relationship between a popover and its invoker button using the `popovertarget` attribute has two additional useful effects:
     */
    popovertarget?: string

    /**
     * Specifies the action to be performed on a popover element being controlled by a control `<button `. Possible values are: The button will hide a shown popover. If you try to hide an already hidden popover, no action will be taken. The button will show a hidden popover. If you try to show an already showing popover, no action will be taken. The button will toggle a popover between showing and hidden. If the popover is hidden, it will be shown; if the popover is showing, it will be hidden. If `popovertargetaction` is omitted, `"toggle"` is the default action that will be performed by the control button.
     *
     * Possible values:
     * - "hide"
     * - "show"
     * - "toggle"
     */
    popovertargetaction?: '"hide"' | '"show"' | '"toggle"'

    /**
     * The default behavior of the button. Possible values are:
     *
     * Possible values:
     * - submit
     * - reset
     * - button
     */
    type?: 'submit' | 'reset' | 'button'

    /**
     * Defines the value associated with the button's `name` when it's submitted with the form data. This value is passed to the server in params when the form is submitted using this button.
     */
    value?: string | Numeric
}

