import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'

export interface HtmlAttributes extends CommonAttributes<ElementForTag<'html'>> {
    /**
     * Specifies the XML Namespace of the document. Default value is `"http://www.w3.org/1999/xhtml"`. This is required in documents parsed with XML parsers, and optional in text/html documents.
     */
    xmlns?: string
}

