import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'
import type {Numeric} from '../attributes/StandardGlobalAttributes'

export interface ColgroupAttributes extends CommonAttributes<ElementForTag<'colgroup'>> {
    /**
     * Specifies the number of consecutive columns the `<colgroup>` element spans. The value must be a positive integer greater than zero. If not present, its default value is `1`.
     * > [!NOTE]
     * > The `span` attribute is not permitted if there are one or more  elements within the `<colgroup>`.
     */
    span?: Numeric
}

