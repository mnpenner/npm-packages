import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'

export interface MapAttributes extends CommonAttributes<ElementForTag<'map'>> {
    /**
     * The `name` attribute gives the map a name so that it can be referenced. The attribute must be present and must have a non-empty value with no space characters. The value of the `name` attribute must not be equal to the value of the `name` attribute of another `<map ` element in the same document. If the `id` attribute is also specified, both attributes must have the same value.
     */
    name?: string
}

