import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'

export interface HtmlAttributes extends CommonAttributes<ElementForTag<'html'>> {
    /** xmlns attribute. */
    xmlns?: string
}

