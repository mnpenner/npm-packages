import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'

export interface OutputAttributes extends CommonAttributes<ElementForTag<'output'>> {
    /** for attribute. */
    for?: string
    /** form attribute. */
    form?: string
    /** name attribute. */
    name?: string
}

