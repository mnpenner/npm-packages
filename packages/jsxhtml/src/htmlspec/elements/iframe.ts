import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'
import type {Numeric} from '../attributes/StandardGlobalAttributes'

export interface IframeAttributes extends CommonAttributes<ElementForTag<'iframe'>> {
    /**
     * Specifies a Permissions Policy for the `<iframe `. The policy defines what features are available to the `<iframe ` (for example, access to the microphone, camera, battery, web-share, etc.) based on the origin of the request. See iframes in the `Permissions-Policy` topic for examples.
     */
    allow?: string
    /**
     * Set to `true` if the `<iframe ` can activate fullscreen mode by calling the requestFullscreen() method.
     */
    allowfullscreen?: boolean
    /**
     * Set to `true` to make the `<iframe ` credentialless, meaning that its content will be loaded in a new, ephemeral context. It doesn't have access to the network, cookies, and storage data associated with its origin. It uses a new context local to the top-level document lifetime. In return, the Cross-Origin-Embedder-Policy (COEP) embedding rules can be lifted, so documents with COEP set can embed third-party documents that do not. See IFrame credentialless for more details.
     * @experimental
     */
    credentialless?: string
    /**
     * A Content Security Policy enforced for the embedded resource. See HTMLIFrameElement.csp for details.
     * @experimental
     */
    csp?: string
    /**
     * The height of the frame in CSS pixels. Default is `150`.
     */
    height?: Numeric
    /**
     * Indicates when the browser should load the iframe: Load the iframe immediately on page load (this is the default value). Defer loading of the iframe until it reaches a calculated distance from the visual viewport, as defined by the browser. The intent is to avoid using the network and storage bandwidth required to fetch the frame until the browser is reasonably certain that it will be needed. This improves the performance and cost in most typical use cases, in particular by reducing initial page load times.
     *
     * Possible values:
     * - eager
     * - lazy
     */
    loading?: 'eager' | 'lazy'
    /**
     * A targetable name for the embedded browsing context. This can be used in the `target` attribute of the a, form, or base elements; the `formtarget` attribute of the input or button elements; or the `windowName` parameter in the window.open() method. In addition, the name becomes a property of the Window and Document objects, containing a reference to the embedded window or the element itself.
     */
    name?: string
    /**
     * Contains a string representation of an options object representing a private state token operation; this object has the same structure as the `RequestInit` dictionary's `privateToken` property. IFrames containing this attribute can initiate operations such as issuing or redeeming tokens when their embedded content is loaded.
     * @experimental
     */
    privateToken?: string
    /**
     * Indicates which referrer to send when fetching the frame's resource: The Referer header will not be sent. The Referer header will not be sent to origins without TLS (HTTPS). The sent referrer will be limited to the origin of the referring page: its scheme, host, and port. The referrer sent to other origins will be limited to the scheme, the host, and the port. Navigations on the same origin will still include the path. A referrer will be sent for same origin, but cross-origin requests will contain no referrer information. Only send the origin of the document as the referrer when the protocol security level stays the same (HTTPS→HTTPS), but don't send it to a less secure destination (HTTPS→HTTP). Send a full URL when performing a same-origin request, only send the origin when the protocol security level stays the same (HTTPS→HTTPS), and send no header to a less secure destination (HTTPS→HTTP). The referrer will include the origin _and_ the path (but not the fragment, password, or username). **This value is unsafe**, because it leaks origins and paths from TLS-protected resources to insecure origins.
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
    referrerpolicy?: 'no-referrer' | 'no-referrer-when-downgrade' | 'origin' | 'origin-when-cross-origin' | 'same-origin' | 'strict-origin' | 'strict-origin-when-cross-origin' | 'unsafe-url'
    /**
     * Controls the restrictions applied to the content embedded in the `<iframe `. The value of the attribute can either be empty to apply all restrictions, or space-separated tokens to lift particular restrictions: Allows downloading files through an a or area element with the download attribute, as well as through the navigation that leads to a download of a file. This works regardless of whether the user clicked on the link, or JS code initiated it without user interaction. Allows the page to submit forms. If this keyword is not used, a form will be displayed as normal, but submitting it will not trigger input validation, send data to a web server, or close a dialog. Allows the page to open modal windows by Window.alert(), Window.confirm(), Window.print() and Window.prompt(), while opening a dialog is allowed regardless of this keyword. It also allows the page to receive BeforeUnloadEvent event. Lets the resource lock the screen orientation. Allows the page to use the Pointer Lock API. Allows popups (created, for example, by Window.open() or `target="_blank"`). If this keyword is not used, such functionality will silently fail. Allows a sandboxed document to open a new browsing context without forcing the sandboxing flags upon it. This will allow, for example, a third-party advertisement to be safely sandboxed without forcing the same restrictions upon the page the ad links to. If this flag is not included, a redirected page, popup window, or new tab will be subject to the same sandbox restrictions as the originating `<iframe `. Allows embedders to have control over whether an iframe can start a presentation session. If this token is not used, the resource is treated as being from a special origin that always fails the same-origin policy (potentially preventing access to data storage/cookies and some JavaScript APIs). Allows the page to run scripts (but not create pop-up windows). If this keyword is not used, this operation is not allowed. Allows a document loaded in the `<iframe ` to use the Storage Access API to request access to unpartitioned cookies. Lets the resource navigate the top-level browsing context (the one named `_top`). Lets the resource navigate the top-level browsing context, but only if initiated by a user gesture. Allows navigations to non-`http` protocols built into browser or registered by a website. This feature is also activated by `allow-popups` or `allow-top-navigation` keyword.
     */
    sandbox?: string
    /**
     * The URL of the page to embed. Use a value of `about:blank` to embed an empty page that conforms to the same-origin policy. Also note that programmatically removing an `<iframe `'s src attribute (e.g., via Element.removeAttribute()) causes `about:blank` to be loaded in the frame in Firefox (from version 65), Chromium-based browsers, and Safari/iOS.
     */
    src?: string
    /**
     * Inline HTML to embed, overriding the `src` attribute. Its content should follow the syntax of a full HTML document, which includes the doctype directive, `<html `, `<body ` tags, etc., although most of them can be omitted, leaving only the body content. This doc will have `about:srcdoc` as its location. If a browser does not support the `srcdoc` attribute, it will fall back to the URL in the `src` attribute.
     */
    srcdoc?: string
    /**
     * The width of the frame in CSS pixels. Default is `300`. These attributes are deprecated and may no longer be supported by all user agents. You should not use them in new content, and try to remove them from existing content.
     */
    width?: Numeric
    /**
     * Only when the frame's content is larger than its dimensions. Always show a scrollbar. Never show a scrollbar.
     *
     * Possible values:
     * - yes
     * - no
     */
    auto?: 'yes' | 'no'

}