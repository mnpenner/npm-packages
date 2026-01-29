import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'

export interface OptgroupAttributes extends CommonAttributes<ElementForTag<'optgroup'>> {
    disabled?: string
    label?: string
}

