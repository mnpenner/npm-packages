import type {CommonProps} from '../../jsx-types'

/**
 * @deprecated
 */
export interface MarqueeSpecificAttributes {
}

export type MarqueeAttributes = MarqueeSpecificAttributes & CommonProps<HTMLMarqueeElement>
