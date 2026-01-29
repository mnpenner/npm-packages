import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'

export interface OlAttributes extends CommonAttributes<ElementForTag<'ol'>> {
    reversed?: string
    start?: string
    type?: string
}

