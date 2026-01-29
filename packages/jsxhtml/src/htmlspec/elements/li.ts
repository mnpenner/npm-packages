import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'
import type {Numeric} from '../attributes/StandardGlobalAttributes'

export interface LiAttributes extends CommonAttributes<ElementForTag<'li'>> {
    /**
     * This integer attribute indicates the current ordinal value of the list item as defined by the  element. The only allowed value for this attribute is a number, even if the list is displayed with Roman numerals or letters. List items that follow this one continue numbering from the value set. This attribute has no meaning for unordered lists () or for menus ().
     */
    value?: string | Numeric
}

