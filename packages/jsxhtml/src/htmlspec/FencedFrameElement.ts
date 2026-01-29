/**
 * All standard attributes for the <fencedframe> HTML element.
 */
export type FencedFrameAttributes = {
    /**
     * Specifies a Permissions Policy for the fenced frame.
     */
    allow?: string

    /**
     * The height of the fenced frame in CSS pixels.
     */
    height?: number | string

    /**
     * The width of the fenced frame in CSS pixels.
     */
    width?: number | string
}
