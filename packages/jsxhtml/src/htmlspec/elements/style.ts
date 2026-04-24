import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'
import type {CssFrag} from '../../template-strings'

/**
 * Represents the attributes of a <style> HTML element.
 */
export interface StyleAttributes extends CommonAttributes<ElementForTag<'style'>> {
    /**
     * This attribute explicitly indicates that certain operations should be blocked on the fetching of critical subresources and the application of the stylesheet to the document. @import-ed stylesheets are generally considered as critical subresources, whereas background-image and fonts are not. The operations that are to be blocked must be a space-separated list of blocking tokens listed below. Currently there is only one token:
     *
     * Possible values:
     * - render
     */
    blocking?: 'render'

    /**
     * This attribute defines which media the style should be applied to. Its value is a media query, which defaults to `all` if the attribute is missing.
     */
    media?: string



    /** children attribute. */
    children?: CssFrag
}

