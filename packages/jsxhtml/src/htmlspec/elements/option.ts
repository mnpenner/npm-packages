import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'

export interface OptionAttributes extends CommonAttributes<ElementForTag<'option'>> {
    disabled?: string
    label?: string
    selected?: string
    value?: string
}

