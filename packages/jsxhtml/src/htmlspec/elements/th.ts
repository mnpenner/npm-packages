import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'
import type {Numeric} from '../attributes/StandardGlobalAttributes'

export interface ThAttributes extends CommonAttributes<ElementForTag<'th'>> {
    /** abbr attribute. */
    abbr?: string
    /** colspan attribute. */
    colspan?: Numeric
    /** headers attribute. */
    headers?: string
    /** rowspan attribute. */
    rowspan?: Numeric
    /** scope attribute. */
    scope?: string
}

