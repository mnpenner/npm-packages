import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'

export interface BaseAttributes extends CommonAttributes<ElementForTag<'base'>> {
    /** href attribute. */
    href?: string
    /** target attribute. */
    target?: string
}

