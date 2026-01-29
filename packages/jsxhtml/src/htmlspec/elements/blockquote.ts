import type {CommonProps} from '../../jsx-types'

export interface BlockquoteSpecificAttributes {
}

export type BlockquoteAttributes = BlockquoteSpecificAttributes & CommonProps<HTMLQuoteElement>
