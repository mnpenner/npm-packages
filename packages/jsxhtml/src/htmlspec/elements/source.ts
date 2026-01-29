import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'
import type {Numeric} from '../attributes/StandardGlobalAttributes'

export interface SourceAttributes extends CommonAttributes<ElementForTag<'source'>> {
    /** type attribute. */
    type?: string
    /** src attribute. */
    src?: string
    /** srcset attribute. */
    srcset?: string
    /** sizes attribute. */
    sizes?: string
    /** media attribute. */
    media?: string
    /** height attribute. */
    height?: Numeric
    /** width attribute. */
    width?: Numeric
}

