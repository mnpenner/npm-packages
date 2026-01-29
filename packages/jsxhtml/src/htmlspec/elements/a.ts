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
     * Causes the browser to treat the linked URL as a download. Can be used with or without a filename value:
     *
     *   - Without a value, the browser will suggest a filename/extension, generated from various sources:
     *     - The `Content-Disposition` HTTP header
     *     - The final segment in the URL path
     *     - The media type (from the Content-Type header, the start of a data: URL, or Blob.type for a blob: URL)
     *   - `filename`: defining a value suggests it as the filename. / and \\ characters are converted to underscores
     * (_). Filesystems may forbid other characters in filenames, so browsers will adjust the suggested name if
     * necessary.
     */
    download?: true | string

    /**
     * The URL that the hyperlink points to. Links are not restricted to HTTP-based URLs — they can use any URL scheme
     * supported by browsers:
     *
     *   - Sections of a page with document fragments
     *   - Specific text portions with text fragments
     *   - Pieces of media files with media fragments
     *   - Telephone numbers with tel: URLs
     *   - Email addresses with mailto: URLs
     *   - SMS text messages with sms: URLs
     *   - While web browsers may not support other URL schemes, websites can with registerProtocolHandler()
     */
    href?: string

    /**
     * Hints at the human language of the linked URL. No built-in functionality. Allowed values are the same as the
     * global lang attribute.
     */
    hreflang?: string

    /**
     * Defines the <a> element as an interest invoker, targeting the element with the given id.
     * @experimental
     * @nonstandard
     */
    interestfor?: string

    /**
     * A space-separated list of URLs. When the link is followed, the browser will send POST requests with the body
     * PING to the URLs. Typically for tracking.
     */
    ping?: string
    /**
     * How much of the referrer to send when following the link.
     */
    referrerpolicy?: ReferrerPolicy | string
    /**
     * The relationship of the linked URL as space-separated link types.
     */
    rel?: string
    /**
     * Where to display the linked URL, as the name for a browsing context (a tab, window, or <iframe>).
     */
    target?: '_self' | '_blank' | '_parent' | '_top' | '_unfencedTop' | string
    /**
     * Hints at the linked URL's format with a MIME type. No built-in functionality.
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
