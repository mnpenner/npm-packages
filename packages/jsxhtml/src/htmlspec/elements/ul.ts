import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'

export interface UlAttributes extends CommonAttributes<ElementForTag<'ul'>> {
    /**
     * A fourth bullet type has been defined in the WebTV interface, but not all browsers support it: `triangle`. If not present and if no CSS list-style-type property applies to the element, the user agent selects a bullet type depending on the nesting level of the list.
     *
     * Possible values:
     * - disc
     * - square
     */
    circle?: 'disc' | 'square'

}

