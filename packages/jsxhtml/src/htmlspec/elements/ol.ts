import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'
import type {Numeric} from '../attributes/StandardGlobalAttributes'

export interface OlAttributes extends CommonAttributes<ElementForTag<'ol'>> {
    /**
     * This Boolean attribute specifies that the list's items are in reverse order. Items will be numbered from high to low.
     */
    reversed?: string
    /**
     * An integer to start counting from for the list items. Always an Arabic numeral (1, 2, 3, etc.), even when the numbering `type` is letters or Roman numerals. For example, to start numbering elements from the letter "d" or the Roman numeral "iv," use `start="4"`.
     */
    start?: Numeric
    /**
     * Sets the numbering type:
     */
    type?: string
}

