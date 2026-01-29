import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'
import type {Numeric} from '../attributes/StandardGlobalAttributes'

/**
 * All standard attributes for the `<button>` HTML element.
 */
export interface ButtonAttributes extends CommonAttributes<ElementForTag<'button'>> {
    /** Automatically focus the button when the page loads. */
    autofocus?: boolean

    /**
     * Action to perform on the controlled element:
     * - "show-modal" | "close" | "request-close"
     * - "show-popover" | "hide-popover" | "toggle-popover"
     * - "--custom": custom command (must start with `--`)
     */
    command?: string

    /** ID of the element this button controls as a command button. */
    commandfor?: string

    /** Whether the button is disabled and non-interactive. */
    disabled?: boolean

    /** Associates the button with a `<form>` by ID. */
    form?: string

    /** URL to submit to when clicked. Overrides form’s `action`. */
    formaction?: string

    /**
     * Encoding type for submitted data:
     * - "application/x-www-form-urlencoded" | "multipart/form-data" | "text/plain"
     */
    formenctype?: 'application/x-www-form-urlencoded' | 'multipart/form-data' | 'text/plain'

    /**
     * Method for submitting the form:
     * - "get" | "post" | "dialog"
     */
    formmethod?: 'get' | 'post' | 'dialog'

    /** Skip form validation on submit. */
    formnovalidate?: boolean

    /**
     * Browsing context for the response:
     * - "_self" | "_blank" | "_parent" | "_top" | custom target
     */
    formtarget?: string

    /**
     * Defines the <button> element as an interest invoker, targeting the element with the given id.
     * @experimental
     * @nonstandard
     */
    interestfor?: string

    /** Name of the button, submitted as name=value with the form. */
    name?: string

    /** ID of the popover element controlled by this button. */
    popovertarget?: string

    /**
     * Action to perform on the popover:
     * - "show" | "hide" | "toggle"
     */
    popovertargetaction?: 'show' | 'hide' | 'toggle'

    /**
     * Button type:
     * - "submit" (default), "reset", or "button"
     */
    type?: 'submit' | 'reset' | 'button'

    /** Value submitted with the form when using this button. */
    value?: string | Numeric
}

