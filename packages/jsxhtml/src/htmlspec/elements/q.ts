import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'

export interface QAttributes extends CommonAttributes<ElementForTag<'q'>> {
    /**
     * The value of this attribute is a URL that designates a source document or message for the information quoted. This attribute is intended to point to information explaining the context or the reference for the quote.
     */
    cite?: string
}

