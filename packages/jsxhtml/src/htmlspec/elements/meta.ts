import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'

export interface MetaAttributes extends CommonAttributes<ElementForTag<'meta'>> {
    /**
     * This attribute declares the document's character encoding. If the attribute is present, its value must be an ASCII case-insensitive match for the string `"utf-8"`, because UTF-8 is the only valid encoding for HTML5 documents. `<meta ` elements which declare a character encoding must be located entirely within the first 1024 bytes of the document.
     */
    charset?: string

    /**
     * The **`content`** attribute specifies the value of a metadata name defined by the `<meta ` `name` attribute. It takes a string as its value, and the expected syntax varies depending on the `name` value used.
     */
    content?: string

    /**
     * The `name` and `content` attributes can be used together to provide document metadata in terms of name-value pairs, with the `name` attribute giving the metadata name, and the `content` attribute giving the value.
     */
    name?: string

    /**
     * Defines a pragma directive, which are instructions for the browser for processing the document. The attribute's name is short for `http-equivalent` because the allowed values are names of equivalent HTTP headers.
     */
    'http-equiv'?: string
    /**
     * The `media` attribute defines which media the theme color defined in the `content` attribute should be applied to. Its value is a media query, which defaults to `all` if the attribute is missing. This attribute is only relevant when the element's `name` attribute is set to `theme-color`. Otherwise, it has no effect, and should not be included.
     */
    media?: string
}
