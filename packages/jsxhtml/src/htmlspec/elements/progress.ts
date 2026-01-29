import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'

export interface ProgressAttributes extends CommonAttributes<ElementForTag<'progress'>> {
    max?: string
    value?: string
}

