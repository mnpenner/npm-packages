import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'

export interface MapAttributes extends CommonAttributes<ElementForTag<'map'>> {
    /** name attribute. */
    name?: string
}

