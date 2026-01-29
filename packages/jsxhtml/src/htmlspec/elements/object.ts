import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'

export interface ObjectAttributes extends CommonAttributes<ElementForTag<'object'>> {
    data?: string
    form?: string
    height?: string
    name?: string
    type?: string
    width?: string
}

