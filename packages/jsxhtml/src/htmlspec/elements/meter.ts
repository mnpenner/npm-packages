import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'

export interface MeterAttributes extends CommonAttributes<ElementForTag<'meter'>> {
    value?: string
    min?: string
    max?: string
    low?: string
    high?: string
    optimum?: string
}

