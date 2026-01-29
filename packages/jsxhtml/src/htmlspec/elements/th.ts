import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'
import type {Numeric} from '../attributes/StandardGlobalAttributes'

export interface ThAttributes extends CommonAttributes<ElementForTag<'th'>> {
    /**
     * A short, abbreviated description of the header cell's content provided as an alternative label to use for the header cell when referencing the cell in other contexts. Some user-agents, such as screen readers, may present this description before the content itself.
     */
    abbr?: string
    /**
     * A non-negative integer value indicating how many columns the header cell spans or extends. The default value is `1`. User agents dismiss values higher than 1000 as incorrect, defaulting such values to `1`.
     */
    colspan?: Numeric
    /**
     * A list of space-separated strings corresponding to the `id` attributes of the `<th>` elements that provide the headers for this header cell.
     */
    headers?: string
    /**
     * A non-negative integer value indicating how many rows the header cell spans or extends. The default value is `1`; if its value is set to `0`, the header cell will extend to the end of the table grouping section (, , , even if implicitly defined), that the `<th>` belongs to. Values higher than `65534` are clipped at `65534`.
     */
    rowspan?: Numeric
    /**
     * Defines the cells that the header (defined in the `<th>`) element relates to. Possible  values are:
     */
    scope?: string
}

