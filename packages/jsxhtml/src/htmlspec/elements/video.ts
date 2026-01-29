import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'

export interface VideoAttributes extends CommonAttributes<ElementForTag<'video'>> {
    autoplay?: string
    controls?: string
    controlslist?: string
    crossorigin?: string
    disablepictureinpicture?: string
    disableremoteplayback?: string
    height?: string
    loop?: string
    muted?: string
    playsinline?: string
    poster?: string
    preload?: string
    src?: string
    width?: string
}

