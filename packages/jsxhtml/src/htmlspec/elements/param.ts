import type {CommonProps} from '../../jsx-types'

/**
 * @deprecated
 */
export interface ParamSpecificAttributes {
}

export type ParamAttributes = ParamSpecificAttributes & CommonProps<HTMLParamElement>
