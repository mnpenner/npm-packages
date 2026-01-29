import type {CommonProps} from '../../jsx-types'

/**
 * @deprecated
 */
export interface NobrSpecificAttributes {
}

export type NobrAttributes = NobrSpecificAttributes & CommonProps<HTMLElement>
