import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'

export interface SelectAttributes extends CommonAttributes<ElementForTag<'select'>> {
    autocomplete?: string
    disabled?: string
    form?: string
    multiple?: string
    name?: string
    required?: string
    size?: string
}

