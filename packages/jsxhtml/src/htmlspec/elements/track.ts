import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'

export interface TrackAttributes extends CommonAttributes<ElementForTag<'track'>> {
    /** default attribute. */
    default?: string
    /** kind attribute. */
    kind?: string
    /** label attribute. */
    label?: string
    /** src attribute. */
    src?: string
    /** srclang attribute. */
    srclang?: string
}

