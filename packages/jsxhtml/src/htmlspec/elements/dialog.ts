import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'

export interface DialogAttributes extends CommonAttributes<ElementForTag<'dialog'>> {
    /** closedby attribute. */
    closedby?: string
    /** open attribute. */
    open?: string
}

