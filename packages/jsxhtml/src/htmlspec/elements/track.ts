import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'

export interface TrackAttributes extends CommonAttributes<ElementForTag<'track'>> {
    default?: string
    kind?: string
    label?: string
    src?: string
    srclang?: string
}

