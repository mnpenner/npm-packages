import type {CommonProps} from '../../jsx-types'

export interface RtSpecificAttributes {
}

export type RtAttributes = RtSpecificAttributes & CommonProps<HTMLElement>
