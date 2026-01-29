import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'

export interface MetaAttributes extends CommonAttributes<ElementForTag<'meta'>> {
    /**
     * Declares the character encoding for the document.
     */
    charset?: string

    /**
     * Specifies the value associated with the `name` or `http-equiv` attribute.
     */
    content?: string

    /**
     * Provides the name for the metadata entry.
     */
    name?: string

    /**
     * Provides an HTTP header for the information/value of the content attribute.
     */
    'http-equiv'?: string
    /** media attribute. */
    media?: string
}
