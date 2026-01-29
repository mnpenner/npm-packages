import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'

export interface TemplateAttributes extends CommonAttributes<ElementForTag<'template'>> {
    /** shadowrootmode attribute. */
    shadowrootmode?: string
    /** shadowrootclonable attribute. */
    shadowrootclonable?: string
    /** shadowrootdelegatesfocus attribute. */
    shadowrootdelegatesfocus?: string
    /** shadowrootreferencetarget attribute. */
    shadowrootreferencetarget?: string
    /** shadowrootserializable attribute. */
    shadowrootserializable?: string
}

