import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'

export interface LinkAttributes extends CommonAttributes<ElementForTag<'link'>> {
    /**
     * This attribute is required when [`rel="preload"`](/en-US/docs/Web/HTML/Reference/Attributes/rel/preload) has been set on the `<link>` element, optional when [`rel="modulepreload"`](/en-US/docs/Web/HTML/Reference/Attributes/rel/modulepreload) has been set, and otherwise should not be used.
     * It specifies the type of content being loaded by the `<link>`, which is necessary for request matching, application of correct [content security policy](/en-US/docs/Web/HTTP/Guides/CSP), and setting of correct  request header.
     * Furthermore, `rel="preload"` uses this as a signal for request prioritization.
     * The table below lists the valid values for this attribute and the elements or resources they apply to.
     * <table class="standard-table">
     * <thead>
     * <tr>
     * <th scope="col">Value</th>
     * <th scope="col">Applies To</th>
     * </tr>
     * </thead>
     * <tbody>
     * <tr>
     * <td>audio</td>
     * <td><code>&#x3C;audio></code> elements</td>
     * </tr>
     * <tr>
     * <td>document</td>
     * <td><code>&#x3C;iframe></code> and <code>&#x3C;frame></code> elements</td>
     * </tr>
     * <tr>
     * <td>embed</td>
     * <td><code>&#x3C;embed></code> elements</td>
     * </tr>
     * <tr>
     * <td>fetch</td>
     * <td>
     * <p>fetch, XHR</p>
     * <div class="notecard note">
     * <p>
     * <strong>Note:</strong> This value also requires
     * <code>&#x3C;link></code> to contain the crossorigin attribute, see <a href="/en-US/docs/Web/HTML/Reference/Attributes/rel/preload#cors-enabled_fetches">CORS-enabled fetches</a>.
     * </p>
     * </div>
     * </td>
     * </tr>
     * <tr>
     * <td>font</td>
     * <td>
     * <p>CSS @font-face</p>
     * <div class="notecard note">
     * <p>
     * <strong>Note:</strong> This value also requires
     * <code>&#x3C;link></code> to contain the crossorigin attribute, see <a href="/en-US/docs/Web/HTML/Reference/Attributes/rel/preload#cors-enabled_fetches">CORS-enabled fetches</a>.
     * </p>
     * </div>
     * </td>
     * </tr>
     * <tr>
     * <td>image</td>
     * <td>
     * <code>&#x3C;img></code> and <code>&#x3C;picture></code> elements with
     * srcset or imageset attributes, SVG <code>&#x3C;image></code> elements,
     * CSS <code>*-image</code> rules
     * </td>
     * </tr>
     * <tr>
     * <td>object</td>
     * <td><code>&#x3C;object></code> elements</td>
     * </tr>
     * <tr>
     * <td>script</td>
     * <td>
     * <code>&#x3C;script></code> elements, Worker <code>importScripts</code>
     * </td>
     * </tr>
     * <tr>
     * <td>style</td>
     * <td>
     * <code>&#x3C;link rel=stylesheet></code> elements, CSS
     * <code>@import</code>
     * </td>
     * </tr>
     * <tr>
     * <td>track</td>
     * <td><code>&#x3C;track></code> elements</td>
     * </tr>
     * <tr>
     * <td>video</td>
     * <td><code>&#x3C;video></code> elements</td>
     * </tr>
     * <tr>
     * <td>worker</td>
     * <td>Worker, SharedWorker</td>
     * </tr>
     * </tbody>
     * </table>
     */
    as?: string
    /**
     * This attribute explicitly indicates that certain operations should be blocked until specific conditions are met. It must only be used when the `rel` attribute contains the `expect` or `stylesheet` keywords. With [`rel="expect"`](/en-US/docs/Web/HTML/Reference/Attributes/rel#expect), it indicates that operations should be blocked until a specific DOM node has been parsed. With [`rel="stylesheet"`](/en-US/docs/Web/HTML/Reference/Attributes/rel#stylesheet), it indicates that operations should be blocked until an external stylesheet and its critical subresources have been fetched and applied to the document. The operations that are to be blocked must be a space-separated list of blocking tokens listed below. Currently there is only one token:
     */
    blocking?: string
    /**
     * This [enumerated](/en-US/docs/Glossary/Enumerated) attribute indicates whether  must be used when fetching the resource.
     * [CORS-enabled images](/en-US/docs/Web/HTML/How_to/CORS_enabled_image) can be reused in the  element without being _tainted_.
     * The allowed values are:
     */
    crossorigin?: string
    /**
     * For `rel="stylesheet"` only, the `disabled` Boolean attribute indicates whether the described stylesheet should be loaded and applied to the document.
     * If `disabled` is specified in the HTML when it is loaded, the stylesheet will not be loaded during page load.
     * Instead, the stylesheet will be loaded on-demand, if and when the `disabled` attribute is changed to `false` or removed.
     * Setting the `disabled` property in the DOM causes the stylesheet to be removed from the document's  list.
     */
    disabled?: string
    /**
     * Provides a hint of the relative priority to use when fetching a resource of a particular type. Allowed values:
     */
    fetchpriority?: string
    /**
     * This attribute specifies the  of the linked resource. A URL can be absolute or relative.
     */
    href?: string
    /**
     * This attribute indicates the language of the linked resource.
     * It is purely advisory.
     * Values should be valid .
     * Use this attribute only if the [`href`](/en-US/docs/Web/HTML/Reference/Elements/a#href) attribute is present.
     */
    hreflang?: string
    /**
     * For `rel="preload"` and `as="image"` only, the `imagesizes` attribute has similar syntax and semantics as the [`sizes`](/en-US/docs/Web/HTML/Reference/Elements/img#sizes) attribute that indicates to preload the appropriate resource used by an `img` element with corresponding values for its `srcset` and `sizes` attributes.
     */
    imagesizes?: string
    /**
     * For `rel="preload"` and `as="image"` only, the `imagesrcset` attribute has similar syntax and semantics as the [`srcset`](/en-US/docs/Web/HTML/Reference/Elements/img#srcset) attribute that indicates to preload the appropriate resource used by an `img` element with corresponding values for its `srcset` and `sizes` attributes.
     */
    imagesrcset?: string
    /**
     * Contains inline metadata - a base64-encoded cryptographic hash of the resource (file) you're telling the browser to fetch.
     * The browser can use this to verify that the fetched resource has been delivered without unexpected manipulation.
     * The attribute must only be specified when the `rel` attribute is specified to `stylesheet`, `preload`, or `modulepreload`.
     * See [Subresource Integrity](/en-US/docs/Web/Security/Defenses/Subresource_Integrity).
     */
    integrity?: string
    /**
     * This attribute specifies the media that the linked resource applies to. Its value must be a media type / [media query](/en-US/docs/Web/CSS/Guides/Media_queries).
     * This attribute is mainly useful when linking to external stylesheets - it allows the user agent to pick the best adapted one for the device it runs on.
     */
    media?: string
    /**
     * A string indicating which referrer to use when fetching the resource:
     */
    referrerpolicy?: string
    /**
     * This attribute names a relationship of the linked document to the current document. The attribute must be a space-separated list of [link type values](/en-US/docs/Web/HTML/Reference/Attributes/rel).
     */
    rel?: string
    /**
     * This attribute defines the sizes of the icons for visual media contained in the resource.
     * It must be present only if the [`rel`](#rel) contains a value of `icon` or a non-standard type such as Apple's `apple-touch-icon`.
     * It may have the following values:
     */
    sizes?: string
    /**
     * This attribute is used to define the type of the content linked to.
     * The value of the attribute should be a MIME type such as **text/html**, **text/css**, and so on.
     * The common use of this attribute is to define the type of stylesheet being referenced (such as **text/css**), but given that CSS is the only stylesheet language used on the web, not only is it possible to omit the `type` attribute, but is actually now recommended practice.
     * It is also used on `rel="preload"` link types, to make sure the browser only downloads file types that it supports.
     */
    type?: string
}

