import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'
import type {Numeric} from '../attributes/StandardGlobalAttributes'

export interface CanvasAttributes extends CommonAttributes<ElementForTag<'canvas'>> {
    /** height attribute. */
    height?: Numeric
    /** width attribute. */
    width?: Numeric
}

