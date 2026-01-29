import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'

export interface DetailsAttributes extends CommonAttributes<ElementForTag<'details'>> {
    /**
     * This Boolean attribute indicates whether the details - that is, the contents of the `<details ` element - are currently visible. The details are shown when this attribute exists, or hidden when this attribute is absent. By default this attribute is absent which means the details are not visible.
     */
    open?: boolean
    /**
     * This attribute enables multiple `<details ` elements to be connected, with only one open at a time. This allows developers to easily create UI features such as accordions without scripting. The `name` attribute specifies a group name - give multiple `<details ` elements the same `name` value to group them. Only one of the grouped `<details ` elements can be open at a time - opening one will cause another to close. If multiple grouped `<details ` elements are given the `open` attribute, only the first one in the source order will be rendered open.
     */
    name?: string
}

