import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'
import type {Numeric} from '../attributes/StandardGlobalAttributes'

export interface VideoAttributes extends CommonAttributes<ElementForTag<'video'>> {
    /** autoplay attribute. */
    autoplay?: string
    /** controls attribute. */
    controls?: string
    /** controlslist attribute. */
    controlslist?: string
    /** crossorigin attribute. */
    crossorigin?: string
    /** disablepictureinpicture attribute. */
    disablepictureinpicture?: string
    /** disableremoteplayback attribute. */
    disableremoteplayback?: string
    /** height attribute. */
    height?: Numeric
    /** loop attribute. */
    loop?: string
    /** muted attribute. */
    muted?: string
    /** playsinline attribute. */
    playsinline?: string
    /** poster attribute. */
    poster?: string
    /** preload attribute. */
    preload?: string
    /** src attribute. */
    src?: string
    /** width attribute. */
    width?: Numeric
}

