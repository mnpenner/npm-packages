import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'

export interface DetailsAttributes extends CommonAttributes<ElementForTag<'details'>> {
    /** open attribute. */
    open?: string
    /** name attribute. */
    name?: string
}

