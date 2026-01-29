import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'

export interface AreaAttributes extends CommonAttributes<ElementForTag<'area'>> {
    /** alt attribute. */
    alt?: string
    /** coords attribute. */
    coords?: string
    /** download attribute. */
    download?: string
    /** href attribute. */
    href?: string
    /** interestfor attribute. */
    interestfor?: string
    /** ping attribute. */
    ping?: string
    /** referrerpolicy attribute. */
    referrerpolicy?: string
    /** rel attribute. */
    rel?: string
    /** shape attribute. */
    shape?: string
    /** target attribute. */
    target?: string
}

