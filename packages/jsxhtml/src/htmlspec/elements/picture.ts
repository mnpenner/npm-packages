import type {CommonProps} from '../../jsx-types'

export interface PictureSpecificAttributes {
}

export type PictureAttributes = PictureSpecificAttributes & CommonProps<HTMLPictureElement>
