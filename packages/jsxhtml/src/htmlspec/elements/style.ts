import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'
import type {CssFrag} from '../../template-strings'

/**
 * Represents the attributes of a <style> HTML element.
 */
export interface StyleAttributes extends CommonAttributes<ElementForTag<'style'>> {
    /**
     * This attribute explicitly indicates that certain operations should be blocked on the fetching of critical subresources and the application of the stylesheet to the document. -ed stylesheets are generally considered as critical subresources, whereas  and fonts are not. The operations that are to be blocked must be a space-separated list of blocking tokens listed below. Currently there is only one token:
     */
    blocking?: string

    /**
     * This attribute defines which media the style should be applied to. Its value is a [media query](/en-US/docs/Web/CSS/Guides/Media_queries/Using), which defaults to `all` if the attribute is missing.
     */
    media?: string

    /**
     * A cryptographic  (number used once) used to allow inline styles in a [style-src Content-Security-Policy](/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/style-src). The server must generate a unique nonce value each time it transmits a policy. It is critical to provide a nonce that cannot be guessed as bypassing a resource's policy is otherwise trivial.
     */
    nonce?: string

    /**
     * This attribute specifies [alternative style sheet](/en-US/docs/Web/HTML/Reference/Attributes/rel/alternate_stylesheet) sets.
     */
    title?: string

    /**
     * @deprecated Only allowed value is "text/css" or empty string.
     */
    type?: '' | 'text/css'

    /** children attribute. */
    children?: CssFrag
}

