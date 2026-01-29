import type {CommonProps} from '../../jsx-types'

/**
 * @deprecated
 */
export interface RtcSpecificAttributes {
}

export type RtcAttributes = RtcSpecificAttributes & CommonProps<HTMLElement>
