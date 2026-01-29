import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'
import type {Numeric} from '../attributes/StandardGlobalAttributes'

/**
 * @experimental
 */
export interface FencedframeAttributes extends CommonAttributes<ElementForTag<'fencedframe'>> {
    /**
     * Specifies a Permissions Policy for the `<fencedframe `, which defines what features are available to the `<fencedframe ` based on the origin of the request. See Permissions policies available to fenced frames for more details of which features can be controlled via a policy set on a fenced frame.
     */
    allow?: string

    /**
     * A unitless integer representing the height of the fenced frame in CSS pixels. The default is `150`.
     */
    height?: Numeric

    /**
     * A unitless integer representing the width of the fenced frame in CSS pixels. The default is `300`.
     */
    width?: Numeric
}

