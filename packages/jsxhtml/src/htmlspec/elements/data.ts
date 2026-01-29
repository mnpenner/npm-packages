import type {CommonProps} from '../../jsx-types'

export interface DataSpecificAttributes {
}

export type DataAttributes = DataSpecificAttributes & CommonProps<HTMLDataElement>
