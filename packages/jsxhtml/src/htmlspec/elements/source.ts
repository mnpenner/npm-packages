import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'

export interface SourceAttributes extends CommonAttributes<ElementForTag<'source'>> {
    type?: string
    src?: string
    srcset?: string
    sizes?: string
    media?: string
    height?: string
    width?: string
}

