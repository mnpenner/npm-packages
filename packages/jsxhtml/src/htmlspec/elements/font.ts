import type {CommonProps} from '../../jsx-types'

/**
 * @deprecated
 */
export interface FontSpecificAttributes {
}

export type FontAttributes = FontSpecificAttributes & CommonProps<HTMLFontElement>
