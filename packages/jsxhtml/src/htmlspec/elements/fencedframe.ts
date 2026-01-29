import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'
import type {Numeric} from '../attributes/StandardGlobalAttributes'

/**
 * @experimental
 */
export interface FencedframeAttributes extends CommonAttributes<ElementForTag<'fencedframe'>> {
    /**
     * Specifies a Permissions Policy for the fenced frame.
     */
    allow?: string

    /**
     * The height of the fenced frame in CSS pixels.
     */
    height?: Numeric

    /**
     * The width of the fenced frame in CSS pixels.
     */
    width?: Numeric
}

