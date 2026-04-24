import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'
import type {Numeric} from '../attributes/StandardGlobalAttributes'

export interface ColAttributes extends CommonAttributes<ElementForTag<'col'>> {
    /**
     * Specifies the number of consecutive columns the `<col ` element spans. The value must be a positive integer greater than zero. If not present, its default value is `1`. The following attributes are deprecated and should not be used. They are documented below for reference when updating existing code and for historical interest only.
     */
    span?: Numeric
}

