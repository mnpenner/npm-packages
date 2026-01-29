import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'

export interface SlotAttributes extends CommonAttributes<ElementForTag<'slot'>> {
    name?: string
}

