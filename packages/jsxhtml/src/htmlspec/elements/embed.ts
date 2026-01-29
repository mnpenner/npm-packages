import type {CommonProps} from '../../jsx-types'

export interface EmbedSpecificAttributes {
}

export type EmbedAttributes = EmbedSpecificAttributes & CommonProps<HTMLEmbedElement>
