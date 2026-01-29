import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'

export interface DataAttributes extends CommonAttributes<ElementForTag<'data'>> {
    value?: string
}

