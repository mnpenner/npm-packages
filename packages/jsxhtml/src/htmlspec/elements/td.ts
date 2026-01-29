import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'
import type {Numeric} from '../attributes/StandardGlobalAttributes'

export interface TdAttributes extends CommonAttributes<ElementForTag<'td'>> {
    /** colspan attribute. */
    colspan?: Numeric
    /** headers attribute. */
    headers?: string
    /** rowspan attribute. */
    rowspan?: Numeric
}

