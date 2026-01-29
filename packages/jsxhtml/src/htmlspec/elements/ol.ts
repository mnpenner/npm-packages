import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'
import type {Numeric} from '../attributes/StandardGlobalAttributes'

export interface OlAttributes extends CommonAttributes<ElementForTag<'ol'>> {
    /** reversed attribute. */
    reversed?: string
    /** start attribute. */
    start?: Numeric
    /** type attribute. */
    type?: string
}

