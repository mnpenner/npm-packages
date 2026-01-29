import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'

export interface AudioAttributes extends CommonAttributes<ElementForTag<'audio'>> {
    /** autoplay attribute. */
    autoplay?: string
    /** controls attribute. */
    controls?: string
    /** controlslist attribute. */
    controlslist?: string
    /** crossorigin attribute. */
    crossorigin?: string
    /** disableremoteplayback attribute. */
    disableremoteplayback?: string
    /** loop attribute. */
    loop?: string
    /** muted attribute. */
    muted?: string
    /** preload attribute. */
    preload?: string
    /** src attribute. */
    src?: string
}

