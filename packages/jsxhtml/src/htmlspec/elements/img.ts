import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'
import type {Numeric} from '../attributes/StandardGlobalAttributes'

export interface ImgAttributes extends CommonAttributes<ElementForTag<'img'>> {
    /** alt attribute. */
    alt?: string
    /** crossorigin attribute. */
    crossorigin?: string
    /** decoding attribute. */
    decoding?: string
    /** elementtiming attribute. */
    elementtiming?: string
    /** fetchpriority attribute. */
    fetchpriority?: string
    /** height attribute. */
    height?: Numeric
    /** ismap attribute. */
    ismap?: string
    /** loading attribute. */
    loading?: string
    /** referrerpolicy attribute. */
    referrerpolicy?: string
    /** sizes attribute. */
    sizes?: string
    /** src attribute. */
    src?: string
    /** srcset attribute. */
    srcset?: string
    /** width attribute. */
    width?: Numeric
    /** usemap attribute. */
    usemap?: string
}

