import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'

export interface AudioAttributes extends CommonAttributes<ElementForTag<'audio'>> {
    autoplay?: string
    controls?: string
    controlslist?: string
    crossorigin?: string
    disableremoteplayback?: string
    loop?: string
    muted?: string
    preload?: string
    src?: string
}

