import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'

export interface AreaAttributes extends CommonAttributes<ElementForTag<'area'>> {
    alt?: string
    coords?: string
    download?: string
    href?: string
    interestfor?: string
    ping?: string
    referrerpolicy?: string
    rel?: string
    shape?: string
    target?: string
}

