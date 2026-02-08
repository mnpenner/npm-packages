import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'
import type {AnyString} from '../../util-types'

export interface AAttributes extends CommonAttributes<ElementForTag<'a'>> {
    /**
     * Causes the browser to treat the linked URL as a download. Can be used with or without a `filename` value:
     *
     * Possible values:
     * - filename
     */
    download?: true | AnyString

    /**
     * The URL that the hyperlink points to. Links are not restricted to HTTP-based URLs - they can use any URL scheme supported by browsers: Moreover other URL features can locate specific parts of the resource, including:
     */
    href?: string

    /**
     * Hints at the human language of the linked URL. No built-in functionality. Allowed values are the same as the global `lang` attribute.
     */
    hreflang?: string

    /**
     * Defines the `<a ` element as an **interest invoker**. Its value is the `id` of the target element, which will be affected in some way (normally shown or hidden) when interest is shown or lost on the invoker element (for example, by hovering/unhovering or focusing/blurring it). See Using interest invokers for more details and examples.
     * @experimental
     */
    interestfor?: string

    /**
     * A space-separated list of URLs. When the link is followed, the browser will send POST requests with the body `PING` to the URLs. Typically for tracking.
     */
    ping?: string
    /**
     * How much of the referrer to send when following the link.
     *
     * Possible values:
     * - no-referrer
     * - no-referrer-when-downgrade
     * - origin
     * - origin-when-cross-origin
     * - same-origin
     * - strict-origin
     * - strict-origin-when-cross-origin
     * - unsafe-url
     */
    referrerpolicy?: ReferrerPolicy | AnyString
    /**
     * The **`rel`** attribute defines the relationship between a linked resource and the current document. Valid on link, a, area, and form, the supported values depend on the element on which the attribute is found.
     */
    rel?: string
    /**
     * Where to display the linked URL, as the name for a _browsing context_ (a tab, window, or iframe). The following keywords have special meanings for where to load the URL:
     *
     * Possible values:
     * - _self
     * - _blank
     * - _parent
     * - _top
     * - _unfencedTop
     */
    target?: '_self' | '_blank' | '_parent' | '_top' | '_unfencedTop' | AnyString
    /**
     * Hints at the linked URL's format with a MIME type. No built-in functionality.
     */
    type?: string
}


export const enum ReferrerPolicy {
    NoReferrer = 'no-referrer',
    NoReferrerWhenDowngrade = 'no-referrer-when-downgrade',
    Origin = 'origin',
    OriginWhenCrossOrigin = 'origin-when-cross-origin',
    SameOrigin = 'same-origin',
    StrictOrigin = 'strict-origin',
    StrictOriginWhenCrossOrigin = 'strict-origin-when-cross-origin',
    UnsafeUrl = 'unsafe-url',
}
