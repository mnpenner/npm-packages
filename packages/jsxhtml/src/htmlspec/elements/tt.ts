import type {CommonProps} from '../../jsx-types'

/**
 * @deprecated
 */
export interface TtSpecificAttributes {
}

export type TtAttributes = TtSpecificAttributes & CommonProps<HTMLElement>
