import type {CommonProps} from '../../jsx-types'

export interface BaseSpecificAttributes {
}

export type BaseAttributes = BaseSpecificAttributes & CommonProps<HTMLBaseElement>
