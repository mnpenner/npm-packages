import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'
import type {Numeric} from '../attributes/StandardGlobalAttributes'

export interface TdAttributes extends CommonAttributes<ElementForTag<'td'>> {
    /**
     * Contains a non-negative integer value that indicates how many columns the data cell spans or extends. The default value is `1`. User agents dismiss values higher than 1000 as incorrect, setting to the default value (`1`).
     */
    colspan?: Numeric
    /**
     * Contains a list of space-separated strings, each corresponding to the `id` attribute of the th elements that provide headings for this table cell.
     */
    headers?: string
    /**
     * Contains a non-negative integer value that indicates for how many rows the data cell spans or extends. The default value is `1`; if its value is set to `0`, it extends until the end of the table grouping section (thead, tbody, tfoot, even if implicitly defined), that the cell belongs to. Values higher than `65534` are clipped to `65534`. The following attributes are deprecated and should not be used. They are documented below for reference when updating existing code and for historical interest only.
     */
    rowspan?: Numeric
}

