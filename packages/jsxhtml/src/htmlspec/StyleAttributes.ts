import type {CssFrag} from '../template-strings'

/**
 * Represents the attributes of a <style> HTML element.
 */
export type StyleHTMLAttributes = {
    /** Space-separated list of blocking operations, e.g., "render" */
    blocking?: string

    /** Media query determining when the styles apply, defaults to "all" */
    media?: string

    /** Cryptographic nonce for CSP compliance */
    nonce?: string

    /** Title of the style sheet set */
    title?: string

    /**
     * @deprecated Only allowed value is "text/css" or empty string.
     */
    type?: '' | 'text/css'

    children?: CssFrag
}
