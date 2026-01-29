import type {CommonProps} from '../../jsx-types'

export interface TableSpecificAttributes {
}

export type TableAttributes = TableSpecificAttributes & CommonProps<HTMLTableElement>
