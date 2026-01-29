import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'

export interface LinkAttributes extends CommonAttributes<ElementForTag<'link'>> {
    /** as attribute. */
    as?: string
    /** blocking attribute. */
    blocking?: string
    /** crossorigin attribute. */
    crossorigin?: string
    /** disabled attribute. */
    disabled?: string
    /** fetchpriority attribute. */
    fetchpriority?: string
    /** href attribute. */
    href?: string
    /** hreflang attribute. */
    hreflang?: string
    /** imagesizes attribute. */
    imagesizes?: string
    /** imagesrcset attribute. */
    imagesrcset?: string
    /** integrity attribute. */
    integrity?: string
    /** media attribute. */
    media?: string
    /** referrerpolicy attribute. */
    referrerpolicy?: string
    /** rel attribute. */
    rel?: string
    /** sizes attribute. */
    sizes?: string
    /** type attribute. */
    type?: string
}

