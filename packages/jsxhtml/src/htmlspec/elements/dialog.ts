import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'

export interface DialogAttributes extends CommonAttributes<ElementForTag<'dialog'>> {
    /**
     * Specifies the types of user actions that can be used to close the `<dialog>` element. This attribute distinguishes three methods by which a dialog might be closed:
     * - A _light dismiss user action_, in which the `<dialog>` is closed when the user clicks or taps outside it. This is equivalent to the ["light dismiss" behavior of "auto" state popovers](/en-US/docs/Web/API/Popover_API/Using#auto_state_and_light_dismiss).
     * - A _platform-specific user action_, such as pressing the <kbd>Esc</kbd> key on desktop platforms, or a "back" or "dismiss" gesture on mobile platforms.
     * - A developer-specified mechanism such as a  with a [`click`](/en-US/docs/Web/API/Element/click_event) handler that invokes  or a  submission.
     * Possible values are:
     */
    closedby?: string
    /**
     * Indicates that the dialog box is active and is available for interaction. If the `open` attribute is not set, the dialog box will not be visible to the user.
     * It is recommended to use the `.show()` or `.showModal()` method to render dialogs, rather than the `open` attribute. If a `<dialog>` is opened using the `open` attribute, it is non-modal.
     * > [!NOTE]
     * > While you can toggle between the open and closed states of non-modal dialog boxes by toggling the presence of the `open` attribute, this approach is not recommended. See  for more information.
     */
    open?: string
}

