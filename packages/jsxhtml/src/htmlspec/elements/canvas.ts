import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'
import type {Numeric} from '../attributes/StandardGlobalAttributes'

export interface CanvasAttributes extends CommonAttributes<ElementForTag<'canvas'>> {
    /**
     * The height of the coordinate space in CSS pixels. Defaults to 150.
     */
    height?: Numeric
    /**
     * The width of the coordinate space in CSS pixels. Defaults to 300.
     */
    width?: Numeric
}

