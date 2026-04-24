import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'

export interface DialogAttributes extends CommonAttributes<ElementForTag<'dialog'>> {
    /**
     * Specifies the types of user actions that can be used to close the `<dialog ` element. This attribute distinguishes three methods by which a dialog might be closed: Possible values are: The dialog can be dismissed using any of the three methods. The dialog can be dismissed with a platform-specific user action or a developer-specified mechanism. The dialog can only be dismissed with a developer-specified mechanism. If the `<dialog ` element does not have a valid `closedby` value specified, then
     *
     * Possible values:
     * - any
     * - closerequest
     * - none
     */
    closedby?: 'any' | 'closerequest' | 'none'
    /**
     * Indicates that the dialog box is active and is available for interaction. If the `open` attribute is not set, the dialog box will not be visible to the user. It is recommended to use the `.show()` or `.showModal()` method to render dialogs, rather than the `open` attribute. If a `<dialog ` is opened using the `open` attribute, it is non-modal.
     */
    open?: boolean
}

