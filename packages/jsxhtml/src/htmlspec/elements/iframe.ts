import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'
import type {Numeric} from '../attributes/StandardGlobalAttributes'

export interface IframeAttributes extends CommonAttributes<ElementForTag<'iframe'>> {
    /**
     * Specifies a [Permissions Policy](/en-US/docs/Web/HTTP/Guides/Permissions_Policy) for the `<iframe>`. The policy defines what features are available to the `<iframe>` (for example, access to the microphone, camera, battery, web-share, etc.) based on the origin of the request.
     * See [iframes](/en-US/docs/Web/HTTP/Reference/Headers/Permissions-Policy#iframes) in the `Permissions-Policy` topic for examples.
     * > [!NOTE]
     * > A Permissions Policy specified by the `allow` attribute implements a further restriction on top of the policy specified in the  header. It doesn't replace it.
     */
    allow?: string
    /**
     * Set to `true` if the `<iframe>` can activate fullscreen mode by calling the  method.
     * > [!NOTE]
     * > This attribute is considered a legacy attribute and redefined as `allow="fullscreen *"`.
     */
    allowfullscreen?: string
    /**
     * Set to `true` to make the `<iframe>` credentialless, meaning that its content will be loaded in a new, ephemeral context. It doesn't have access to the network, cookies, and storage data associated with its origin. It uses a new context local to the top-level document lifetime. In return, the  (COEP) embedding rules can be lifted, so documents with COEP set can embed third-party documents that do not. See [IFrame credentialless](/en-US/docs/Web/HTTP/Guides/IFrame_credentialless) for more details.
     */
    credentialless?: string
    /**
     * A [Content Security Policy](/en-US/docs/Web/HTTP/Guides/CSP) enforced for the embedded resource. See  for details.
     */
    csp?: string
    /**
     * The height of the frame in CSS pixels. Default is `150`.
     */
    height?: Numeric
    /**
     * Indicates when the browser should load the iframe:
     */
    loading?: string
    /**
     * A targetable name for the embedded browsing context. This can be used in the `target` attribute of the , , or  elements; the `formtarget` attribute of the  or  elements; or the `windowName` parameter in the  method. In addition, the name becomes a property of the  and  objects, containing a reference to the embedded window or the element itself.
     */
    name?: string
    /**
     * Contains a string representation of an options object representing a [private state token](/en-US/docs/Web/API/Private_State_Token_API/Using) operation; this object has the same structure as the `RequestInit` dictionary's [`privateToken`](/en-US/docs/Web/API/RequestInit#privatetoken) property. IFrames containing this attribute can initiate operations such as issuing or redeeming tokens when their embedded content is loaded.
     */
    privateToken?: string
    /**
     * Indicates which [referrer](/en-US/docs/Web/API/Document/referrer) to send when fetching the frame's resource:
     */
    referrerpolicy?: string
    /**
     * Controls the restrictions applied to the content embedded in the `<iframe>`. The value of the attribute can either be empty to apply all restrictions, or space-separated tokens to lift particular restrictions:
     */
    sandbox?: string
    /**
     * The URL of the page to embed. Use a value of `about:blank` to embed an empty page that conforms to the [same-origin policy](/en-US/docs/Web/Security/Defenses/Same-origin_policy#inherited_origins). Also note that programmatically removing an `<iframe>`'s src attribute (e.g., via ) causes `about:blank` to be loaded in the frame in Firefox (from version 65), Chromium-based browsers, and Safari/iOS.
     * > [!NOTE]
     * > The `about:blank` page uses the embedding document's URL as its base URL when resolving any relative URLs, such as anchor links.
     */
    src?: string
    /**
     * Inline HTML to embed, overriding the `src` attribute. Its content should follow the syntax of a full HTML document, which includes the doctype directive, `<html>`, `<body>` tags, etc., although most of them can be omitted, leaving only the body content. This doc will have `about:srcdoc` as its location. If a browser does not support the `srcdoc` attribute, it will fall back to the URL in the `src` attribute.
     * > [!NOTE]
     * > The `about:srcdoc` page uses the embedding document's URL as its base URL when resolving any relative URLs, such as anchor links.
     */
    srcdoc?: string
    /**
     * The width of the frame in CSS pixels. Default is `300`.
     */
    width?: Numeric
}

