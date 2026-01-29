import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'

export interface TextareaAttributes extends CommonAttributes<ElementForTag<'textarea'>> {
    autocomplete?: string
    cols?: string
    dirname?: string
    disabled?: string
    form?: string
    maxlength?: string
    minlength?: string
    name?: string
    placeholder?: string
    readonly?: string
    required?: string
    rows?: string
    wrap?: string
}

