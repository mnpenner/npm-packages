import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'
import type {JsFrag} from '../../template-strings'

/**
 * All valid properties for a <script> HTML element.
 */
export interface ScriptAttributes extends CommonAttributes<ElementForTag<'script'>> {
    /**
     * For classic scripts, if the `async` attribute is present, then the classic script will be fetched in parallel to parsing and evaluated as soon as it is available.
     * For [module scripts](/en-US/docs/Web/JavaScript/Guide/Modules), if the `async` attribute is present then the scripts and all their dependencies will be fetched in parallel to parsing and evaluated as soon as they are available.
     * > [!WARNING]
     * > This attribute must not be used if the `src` attribute is absent (i.e., for inline scripts) for classic scripts, in this case it would have no effect.
     * This attribute allows the elimination of **parser-blocking JavaScript** where the browser would have to load and evaluate scripts before continuing to parse. `defer` has a similar effect in this case.
     * If the attribute is specified with the `defer` attribute, the element will act as if only the `async` attribute is specified.
     * This is a boolean attribute: the presence of a boolean attribute on an element represents the true value, and the absence of the attribute represents the false value.
     * See [Browser compatibility](#browser_compatibility) for notes on browser support. See also [Async scripts for asm.js](/en-US/docs/Games/Techniques/Async_scripts).
     */
    async?: boolean

    /** Specifies one or more URLs for Attribution Reporting. Can also be a boolean attribute. */
    attributionsrc?: string | boolean

    /**
     * This attribute explicitly indicates that certain operations should be blocked until the script has executed. The operations that are to be blocked must be a space-separated list of blocking tokens. Currently there is only one token:
     */
    blocking?: string

    /**
     * Normal `script` elements pass minimal information to the  for scripts which do not pass the standard  checks. To allow error logging for sites which use a separate domain for static media, use this attribute. See [CORS settings attributes](/en-US/docs/Web/HTML/Reference/Attributes/crossorigin) for a more descriptive explanation of its valid arguments.
     */
    crossorigin?: '' | 'anonymous' | 'use-credentials'

    /**
     * This Boolean attribute is set to indicate to a browser that the script is meant to be executed after the document has been parsed, but before firing  event.
     * Scripts with the `defer` attribute will prevent the `DOMContentLoaded` event from firing until the script has loaded and finished evaluating.
     * > [!WARNING]
     * > This attribute must not be used if the `src` attribute is absent (i.e., for inline scripts), in this case it would have no effect.
     * >
     * > The `defer` attribute has no effect on [module scripts](/en-US/docs/Web/JavaScript/Guide/Modules) - they defer by default.
     * Scripts with the `defer` attribute will execute in the order in which they appear in the document.
     * This attribute allows the elimination of **parser-blocking JavaScript** where the browser would have to load and evaluate scripts before continuing to parse. `async` has a similar effect in this case.
     * If the attribute is specified with the `async` attribute, the element will act as if only the `async` attribute is specified.
     */
    defer?: boolean

    /**
     * Provides a hint of the relative priority to use when fetching an external script. Allowed values:
     */
    fetchpriority?: 'high' | 'low' | 'auto'

    /**
     * This attribute contains inline metadata that a user agent can use to verify that a fetched resource has been delivered without unexpected manipulation. The attribute must not be specified when the `src` attribute is absent. See [Subresource Integrity](/en-US/docs/Web/Security/Defenses/Subresource_Integrity).
     */
    integrity?: string

    /**
     * This Boolean attribute is set to indicate that the script should not be executed in browsers that support [ES modules](/en-US/docs/Web/JavaScript/Guide/Modules) - in effect, this can be used to serve fallback scripts to older browsers that do not support modular JavaScript code.
     */
    nomodule?: boolean

    /**
     * A cryptographic  (number used once) to allow scripts in a [script-src Content-Security-Policy](/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/script-src). The server must generate a unique nonce value each time it transmits a policy. It is critical to provide a nonce that cannot be guessed as bypassing a resource's policy is otherwise trivial.
     */
    nonce?: string

    /**
     * Indicates which [referrer](/en-US/docs/Web/API/Document/referrer) to send when fetching the script, or resources fetched by the script:
     */
    referrerpolicy?:
        | ''
        | 'no-referrer'
        | 'no-referrer-when-downgrade'
        | 'origin'
        | 'origin-when-cross-origin'
        | 'same-origin'
        | 'strict-origin'
        | 'strict-origin-when-cross-origin'
        | 'unsafe-url'

    /**
     * This attribute specifies the URI of an external script; this can be used as an alternative to embedding a script directly within a document.
     */
    src?: string

    /**
     * This attribute indicates the type of script represented.
     * The value of this attribute will be one of the following:
     * - **Attribute is not set (default), an empty string, or a JavaScript MIME type**
     * Indicates that the script is a "classic script", containing JavaScript code.
     * Authors are encouraged to omit the attribute if the script refers to JavaScript code rather than specify a MIME type.
     * JavaScript MIME types are [listed in the IANA media types specification](/en-US/docs/Web/HTTP/Guides/MIME_types#textjavascript).
     */
    type?: '' | 'module' | 'importmap' | 'speculationrules' | string

    /**
     * JavaScript script content. Use the js`` tagged template literal.
     *
     * @example
     * const world="World"
     * const script = <script>{js`const hello=${world}`}</script>
     */
    children?: JsFrag
}

