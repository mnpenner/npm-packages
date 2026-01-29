import type {CommonProps} from '../../jsx-types'

export interface TemplateSpecificAttributes {
}

export type TemplateAttributes = TemplateSpecificAttributes & CommonProps<HTMLTemplateElement>
