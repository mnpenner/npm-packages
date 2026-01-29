import type {CommonProps} from '../../jsx-types'

export interface TextareaSpecificAttributes {
}

export type TextareaAttributes = TextareaSpecificAttributes & CommonProps<HTMLTextAreaElement>
