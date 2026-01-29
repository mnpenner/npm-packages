import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'
import type {Numeric} from '../attributes/StandardGlobalAttributes'

export interface EmbedAttributes extends CommonAttributes<ElementForTag<'embed'>> {
    /** height attribute. */
    height?: Numeric
    /** src attribute. */
    src?: string
    /** type attribute. */
    type?: string
    /** width attribute. */
    width?: Numeric
}

