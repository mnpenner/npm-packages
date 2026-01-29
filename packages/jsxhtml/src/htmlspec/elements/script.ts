import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'
import type {JsFrag} from '../../template-strings'

/**
 * All valid properties for a <script> HTML element.
 */
export interface ScriptAttributes extends CommonAttributes<ElementForTag<'script'>> {
    /**
     * For classic scripts, if the `async` attribute is present, then the classic script will be fetched in parallel to parsing and evaluated as soon as it is available. For module scripts, if the `async` attribute is present then the scripts and all their dependencies will be fetched in parallel to parsing and evaluated as soon as they are available. This attribute allows the elimination of **parser-blocking JavaScript** where the browser would have to load and evaluate scripts before continuing to parse. `defer` has a similar effect in this case. If the attribute is specified with the `defer` attribute, the element will act as if only the `async` attribute is specified. This is a boolean attribute: the presence of a boolean attribute on an element represents the true value, and the absence of the attribute represents the false value. See Browser compatibility for notes on browser support. See also Async scripts for asm.js.
     */
    async?: boolean

    /** Specifies one or more URLs for Attribution Reporting. Can also be a boolean attribute. */
    attributionsrc?: string | boolean

    /**
     * This attribute explicitly indicates that certain operations should be blocked until the script has executed. The operations that are to be blocked must be a space-separated list of blocking tokens. Currently there is only one token:
     *
     * Possible values:
     * - render
     */
    blocking?: 'render'

    /**
     * The **`crossorigin`** attribute, valid on the audio, img, link, script, and video elements, provides support for CORS, defining how the element handles cross-origin requests, thereby enabling the configuration of the CORS requests for the element's fetched data. Depending on the element, the attribute can be a CORS settings attribute.
     */
    crossorigin?: '' | 'anonymous' | 'use-credentials'

    /**
     * This Boolean attribute is set to indicate to a browser that the script is meant to be executed after the document has been parsed, but before firing DOMContentLoaded event. Scripts with the `defer` attribute will prevent the `DOMContentLoaded` event from firing until the script has loaded and finished evaluating. Scripts with the `defer` attribute will execute in the order in which they appear in the document. This attribute allows the elimination of **parser-blocking JavaScript** where the browser would have to load and evaluate scripts before continuing to parse. `async` has a similar effect in this case. If the attribute is specified with the `async` attribute, the element will act as if only the `async` attribute is specified.
     */
    defer?: boolean

    /**
     * The **`fetchpriority`** attribute allows a developer to signal that fetching a particular image early in the loading process has more or less impact on user experience than a browser can reasonably infer when assigning an internal priority. This in turn allows the browser to increase or decrease the priority, and potentially load the image earlier or later than it would otherwise.
     */
    fetchpriority?: 'high' | 'low' | 'auto'

    /**
     * This attribute contains inline metadata that a user agent can use to verify that a fetched resource has been delivered without unexpected manipulation. The attribute must not be specified when the `src` attribute is absent. See Subresource Integrity.
     */
    integrity?: string

    /**
     * This Boolean attribute is set to indicate that the script should not be executed in browsers that support ES modules - in effect, this can be used to serve fallback scripts to older browsers that do not support modular JavaScript code.
     */
    nomodule?: boolean


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
     * This attribute indicates the type of script represented. The value of this attribute will be one of the following: Indicates that the script is a "classic script", containing JavaScript code. Authors are encouraged to omit the attribute if the script refers to JavaScript code rather than specify a MIME type. JavaScript MIME types are listed in the IANA media types specification. This value indicates that the body of the element contains an import map. The import map is a JSON object that developers can use to control how the browser resolves module specifiers when importing JavaScript modules. This value causes the code to be treated as a JavaScript module. The processing of the script contents is deferred. The `charset` and `defer` attributes have no effect. For information on using `module`, see our JavaScript modules guide. Unlike classic scripts, module scripts require the use of the CORS protocol for cross-origin fetching. This value indicates that the body of the element contains speculation rules. Speculation rules take the form of a JSON object that determine what resources should be prefetched or prerendered by the browser. This is part of the Speculation Rules API. The embedded content is treated as a data block, and won't be processed by the browser. Developers must use a valid MIME type that is not a JavaScript MIME type to denote data blocks. All of the other attributes will be ignored, including the `src` attribute.
     *
     * Possible values:
     * - importmap
     * - module
     * - speculationrules
     */
    type?: 'importmap' | 'module' | 'speculationrules'

}