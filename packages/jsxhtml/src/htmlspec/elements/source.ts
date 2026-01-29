import type {CommonProps} from '../../jsx-types'

export interface SourceSpecificAttributes {
}

export type SourceAttributes = SourceSpecificAttributes & CommonProps<HTMLSourceElement>
