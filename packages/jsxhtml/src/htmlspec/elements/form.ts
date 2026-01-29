import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'

export interface FormAttributes extends CommonAttributes<ElementForTag<'form'>> {
    'accept-charset'?: string
    autocomplete?: string
    name?: string
    rel?: string
    action?: string
    enctype?: string
    method?: string
    novalidate?: string
    target?: string
}

