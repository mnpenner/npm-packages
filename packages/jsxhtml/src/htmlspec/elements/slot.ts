import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'

export interface SlotAttributes extends CommonAttributes<ElementForTag<'slot'>> {
    /**
     * The slot's name. When the slot's containing component gets rendered, the slot is rendered with the custom element's child that has a matching [`slot`](/en-US/docs/Web/HTML/Reference/Global_attributes/slot) attribute. A _named slot_ is a `<slot>` element with a `name` attribute. Unnamed slots have the name default to the empty string. Names should be unique per shadow root: if you have two slots with the same name, all of the elements with a matching `slot` attribute will be assigned to the first slot with that name.
     */
    name?: string
}

