import type {CommonProps} from '../../jsx-types'

export interface ImgSpecificAttributes {
}

export type ImgAttributes = ImgSpecificAttributes & CommonProps<HTMLImageElement>
