import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'

export interface LinkAttributes extends CommonAttributes<ElementForTag<'link'>> {
    as?: string
    blocking?: string
    crossorigin?: string
    disabled?: string
    fetchpriority?: string
    href?: string
    hreflang?: string
    imagesizes?: string
    imagesrcset?: string
    integrity?: string
    media?: string
    referrerpolicy?: string
    rel?: string
    sizes?: string
    type?: string
}

