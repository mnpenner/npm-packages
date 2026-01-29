import type {CommonProps} from '../../jsx-types'
import type {JsFrag} from '../../template-strings'

/**
 * All valid properties for a <script> HTML element.
 */
export interface ScriptSpecificAttributes {
    /** Fetches script asynchronously if present. Only works with `src`. */
    async?: boolean

    /** Specifies one or more URLs for Attribution Reporting. Can also be a boolean attribute. */
    attributionsrc?: string | boolean

    /** Space-separated list of operations blocked until script is fetched, e.g., 'render'. */
    blocking?: string

    /** Indicates the CORS setting for error reporting. */
    crossorigin?: '' | 'anonymous' | 'use-credentials'

    /** Defers script execution until after parsing. Only works with `src`. */
    defer?: boolean

    /** Hint about the fetch priority: 'high', 'low', or 'auto' (default). */
    fetchpriority?: 'high' | 'low' | 'auto'

    /** Inline metadata for Subresource Integrity checking. Requires `src`. */
    integrity?: string

    /** Indicates this script is not for module-supporting browsers (fallback). */
    nomodule?: boolean

    /** A cryptographic nonce used for Content Security Policy validation. */
    nonce?: string

    /** Referrer policy to apply when fetching the script. */
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

    /** URL of the external script to load. */
    src?: string

    /** Type of script: omitted or JS MIME type for classic scripts; 'module', 'importmap', etc. for others. */
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

export type ScriptAttributes = ScriptSpecificAttributes & CommonProps<HTMLScriptElement>
