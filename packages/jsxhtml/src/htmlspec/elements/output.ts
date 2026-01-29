import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'

export interface OutputAttributes extends CommonAttributes<ElementForTag<'output'>> {
    for?: string
    form?: string
    name?: string
}

