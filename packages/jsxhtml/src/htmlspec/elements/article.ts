import type {CommonProps} from '../../jsx-types'

export interface ArticleSpecificAttributes {
}

export type ArticleAttributes = ArticleSpecificAttributes & CommonProps<HTMLElement>
