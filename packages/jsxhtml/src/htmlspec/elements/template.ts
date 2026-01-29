import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'

export interface TemplateAttributes extends CommonAttributes<ElementForTag<'template'>> {
    shadowrootmode?: string
    shadowrootclonable?: string
    shadowrootdelegatesfocus?: string
    shadowrootreferencetarget?: string
    shadowrootserializable?: string
}

