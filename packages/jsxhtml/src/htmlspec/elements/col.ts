import type {CommonProps} from '../../jsx-types'

export interface ColSpecificAttributes {
}

export type ColAttributes = ColSpecificAttributes & CommonProps<HTMLTableColElement>
