import type {CommonProps} from '../../jsx-types'

export interface MetaSpecificAttributes {
}

export type MetaAttributes = MetaSpecificAttributes & CommonProps<HTMLMetaElement>
