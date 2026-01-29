import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'

export interface BaseAttributes extends CommonAttributes<ElementForTag<'base'>> {
    /**
     * The base URL to be used throughout the document for relative URLs.
     * Absolute and relative URLs are allowed.
     * [`data:`](/en-US/docs/Web/URI/Reference/Schemes/data) and [`javascript:`](/en-US/docs/Web/URI/Reference/Schemes/javascript) URLs are not allowed.
     */
    href?: string
    /**
     * A **keyword** or **author-defined name** of the default  to show the results of navigation from , , or  elements without explicit `target` attributes. The following keywords have special meanings:
     */
    target?: string
}

