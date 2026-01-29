import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'

export interface CanvasAttributes extends CommonAttributes<ElementForTag<'canvas'>> {
    height?: string
    width?: string
}

