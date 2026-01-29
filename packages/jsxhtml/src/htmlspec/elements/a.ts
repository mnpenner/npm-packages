import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'

export interface AAttributes extends CommonAttributes<ElementForTag<'a'>> {
    /**
     * Specifies that you want the browser to send an Attribution-Reporting-Eligible header.
     * Can be a boolean attribute or a space-separated list of URLs.
     *
     * @deprecated
     */
    attributionsrc?: string | boolean

    /**
     * Causes the browser to treat the linked URL as a download. Can be used with or without a `filename` value:
     * - Without a value, the browser will suggest a filename/extension, generated from various sources:
     * - The  HTTP header
     * - The final segment in the URL [path](/en-US/docs/Web/API/URL/pathname)
     * - The  (from the  header, the start of a [`data:` URL](/en-US/docs/Web/URI/Reference/Schemes/data), or  for a [`blob:` URL](/en-US/docs/Web/URI/Reference/Schemes/blob))
     */
    download?: true | string

    /**
     * The URL that the hyperlink points to. Links are not restricted to HTTP-based URLs - they can use any URL scheme supported by browsers:
     * - Telephone numbers with `tel:` URLs
     * - Email addresses with `mailto:` URLs
     * - SMS text messages with `sms:` URLs
     * - Executable code with [`javascript:` URLs](/en-US/docs/Web/URI/Reference/Schemes/javascript)
     * - While web browsers may not support other URL schemes, websites can with [`registerProtocolHandler()`](/en-US/docs/Web/API/Navigator/registerProtocolHandler)
     * Moreover other URL features can locate specific parts of the resource, including:
     * - Sections of a page with document fragments
     * - Specific text portions with [text fragments](/en-US/docs/Web/URI/Reference/Fragment/Text_fragments)
     * - Pieces of media files with media fragments
     */
    href?: string

    /**
     * Hints at the human language of the linked URL. No built-in functionality. Allowed values are the same as [the global `lang` attribute](/en-US/docs/Web/HTML/Reference/Global_attributes/lang).
     */
    hreflang?: string

    /**
     * Defines the `<a>` element as an **interest invoker**. Its value is the `id` of the target element, which will be affected in some way (normally shown or hidden) when interest is shown or lost on the invoker element (for example, by hovering/unhovering or focusing/blurring it). See [Using interest invokers](/en-US/docs/Web/API/Popover_API/Using_interest_invokers) for more details and examples.
     */
    interestfor?: string

    /**
     * A space-separated list of URLs. When the link is followed, the browser will send  requests with the body `PING` to the URLs. Typically for tracking.
     */
    ping?: string
    /**
     * How much of the [referrer](/en-US/docs/Web/HTTP/Reference/Headers/Referer) to send when following the link.
     */
    referrerpolicy?: ReferrerPolicy | string
    /**
     * The relationship of the linked URL as space-separated link types.
     */
    rel?: string
    /**
     * Where to display the linked URL, as the name for a _browsing context_ (a tab, window, or ). The following keywords have special meanings for where to load the URL:
     */
    target?: '_self' | '_blank' | '_parent' | '_top' | '_unfencedTop' | string
    /**
     * Hints at the linked URL's format with a . No built-in functionality.
     */
    type?: string
    /**
     * @deprecated
     */
    charset?: string
    /**
     * @deprecated
     */
    coords?: string
    /**
     * @deprecated
     */
    name?: string
    /**
     * @deprecated
     */
    rev?: string
    /**
     * @deprecated
     */
    shape?: string
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
