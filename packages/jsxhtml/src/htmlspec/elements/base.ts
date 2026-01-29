import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'

export interface BaseAttributes extends CommonAttributes<ElementForTag<'base'>> {
    /**
     * The base URL to be used throughout the document for relative URLs. Absolute and relative URLs are allowed. `data:` and `javascript:` URLs are not allowed.
     */
    href?: string
    /**
     * A **keyword** or **author-defined name** of the default browsing context to show the results of navigation from a, area, or form elements without explicit `target` attributes. The following keywords have special meanings:
     *
     * Possible values:
     * - _self
     * - _blank
     * - _parent
     * - _top
     */
    target?: '_self' | '_blank' | '_parent' | '_top'
}

