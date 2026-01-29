import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'

export interface ThAttributes extends CommonAttributes<ElementForTag<'th'>> {
    abbr?: string
    colspan?: string
    headers?: string
    rowspan?: string
    scope?: string
}

