import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'

export interface LinkAttributes extends CommonAttributes<ElementForTag<'link'>> {
    /**
     * This attribute is required when `rel="preload"` has been set on the `<link ` element, optional when `rel="modulepreload"` has been set, and otherwise should not be used. It specifies the type of content being loaded by the `<link `, which is necessary for request matching, application of correct content security policy, and setting of correct Accept request header. Furthermore, `rel="preload"` uses this as a signal for request prioritization. The table below lists the valid values for this attribute and the elements or resources they apply to.
     */
    as?: string
    /**
     * This attribute explicitly indicates that certain operations should be blocked until specific conditions are met. It must only be used when the `rel` attribute contains the `expect` or `stylesheet` keywords. With `rel="expect"`, it indicates that operations should be blocked until a specific DOM node has been parsed. With `rel="stylesheet"`, it indicates that operations should be blocked until an external stylesheet and its critical subresources have been fetched and applied to the document. The operations that are to be blocked must be a space-separated list of blocking tokens listed below. Currently there is only one token:
     *
     * Possible values:
     * - render
     */
    blocking?: 'render'
    /**
     * The **`crossorigin`** attribute, valid on the audio, img, link, script, and video elements, provides support for CORS, defining how the element handles cross-origin requests, thereby enabling the configuration of the CORS requests for the element's fetched data. Depending on the element, the attribute can be a CORS settings attribute.
     */
    crossorigin?: 'anonymous' | 'use-credentials'
    /**
     * The Boolean **`disabled`** attribute, when present, makes the element not mutable, focusable, or even submitted with the form. The user can neither edit nor focus on the control, nor its form control descendants.
     */
    disabled?: boolean
    /**
     * The **`fetchpriority`** attribute allows a developer to signal that fetching a particular image early in the loading process has more or less impact on user experience than a browser can reasonably infer when assigning an internal priority. This in turn allows the browser to increase or decrease the priority, and potentially load the image earlier or later than it would otherwise.
     */
    fetchpriority?: 'high' | 'low' | 'auto'
    /**
     * This attribute specifies the URL of the linked resource. A URL can be absolute or relative.
     */
    href?: string
    /**
     * This attribute indicates the language of the linked resource. It is purely advisory. Values should be valid BCP 47 language tags. Use this attribute only if the `href` attribute is present.
     */
    hreflang?: string
    /**
     * For `rel="preload"` and `as="image"` only, the `imagesizes` attribute has similar syntax and semantics as the `sizes` attribute that indicates to preload the appropriate resource used by an `img` element with corresponding values for its `srcset` and `sizes` attributes.
     */
    imagesizes?: string
    /**
     * For `rel="preload"` and `as="image"` only, the `imagesrcset` attribute has similar syntax and semantics as the `srcset` attribute that indicates to preload the appropriate resource used by an `img` element with corresponding values for its `srcset` and `sizes` attributes.
     */
    imagesrcset?: string
    /**
     * Contains inline metadata - a base64-encoded cryptographic hash of the resource (file) you're telling the browser to fetch. The browser can use this to verify that the fetched resource has been delivered without unexpected manipulation. The attribute must only be specified when the `rel` attribute is specified to `stylesheet`, `preload`, or `modulepreload`. See Subresource Integrity.
     */
    integrity?: string
    /**
     * This attribute specifies the media that the linked resource applies to. Its value must be a media type / media query. This attribute is mainly useful when linking to external stylesheets - it allows the user agent to pick the best adapted one for the device it runs on.
     */
    media?: string
    /**
     * A string indicating which referrer to use when fetching the resource: This is a user agent's default behavior, if no policy is otherwise specified. This case is unsafe because it can leak origins and paths from TLS-protected resources to insecure origins.
     *
     * Possible values:
     * - no-referrer
     * - no-referrer-when-downgrade
     * - origin
     * - origin-when-cross-origin
     * - unsafe-url
     */
    referrerpolicy?: 'no-referrer' | 'no-referrer-when-downgrade' | 'origin' | 'origin-when-cross-origin' | 'unsafe-url'
    /**
     * The **`rel`** attribute defines the relationship between a linked resource and the current document. Valid on link, a, area, and form, the supported values depend on the element on which the attribute is found.
     */
    rel?: string
    /**
     * This attribute defines the sizes of the icons for visual media contained in the resource. It must be present only if the `rel` contains a value of `icon` or a non-standard type such as Apple's `apple-touch-icon`. It may have the following values:
     *
     * Possible values:
     * - any
     */
    sizes?: 'any'
    /**
     * This attribute is used to define the type of the content linked to. The value of the attribute should be a MIME type such as **text/html**, **text/css**, and so on. The common use of this attribute is to define the type of stylesheet being referenced (such as **text/css**), but given that CSS is the only stylesheet language used on the web, not only is it possible to omit the `type` attribute, but is actually now recommended practice. It is also used on `rel="preload"` link types, to make sure the browser only downloads file types that it supports.
     */
    type?: string

}

