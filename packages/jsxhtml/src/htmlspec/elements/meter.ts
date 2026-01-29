import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'
import type {Numeric} from '../attributes/StandardGlobalAttributes'

export interface MeterAttributes extends CommonAttributes<ElementForTag<'meter'>> {
    /** value attribute. */
    value?: string | Numeric
    /** min attribute. */
    min?: string | Numeric
    /** max attribute. */
    max?: string | Numeric
    /** low attribute. */
    low?: Numeric
    /** high attribute. */
    high?: Numeric
    /** optimum attribute. */
    optimum?: Numeric
}

