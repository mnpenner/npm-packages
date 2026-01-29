import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'

export interface HtmlAttributes extends CommonAttributes<ElementForTag<'html'>> {
    /**
     * Specifies the   of the document. Default value is `"http://www.w3.org/1999/xhtml"`. This is required in documents parsed with XML , and optional in text/html documents.
     */
    xmlns?: string
}

