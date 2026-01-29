import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'

export interface ImgAttributes extends CommonAttributes<ElementForTag<'img'>> {
    alt?: string
    crossorigin?: string
    decoding?: string
    elementtiming?: string
    fetchpriority?: string
    height?: string
    ismap?: string
    loading?: string
    referrerpolicy?: string
    sizes?: string
    src?: string
    srcset?: string
    width?: string
    usemap?: string
}

