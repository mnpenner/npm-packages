import type {CommonProps} from '../../jsx-types'

/**
 * @deprecated
 */
export interface FrameSpecificAttributes {
}

export type FrameAttributes = FrameSpecificAttributes & CommonProps<HTMLFrameElement>
