import type {CommonProps} from '../../jsx-types'

export interface SpanSpecificAttributes {
}

export type SpanAttributes = SpanSpecificAttributes & CommonProps<HTMLSpanElement>
