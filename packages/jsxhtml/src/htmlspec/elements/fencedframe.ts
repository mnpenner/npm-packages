import type {CommonProps} from '../../jsx-types'

/**
 * @experimental
 */
export interface FencedframeSpecificAttributes {
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

export type FencedframeAttributes = FencedframeSpecificAttributes & CommonProps<HTMLElement>
