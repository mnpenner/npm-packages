import type {CommonProps} from '../../jsx-types'

/**
 * @deprecated
 */
export interface DirSpecificAttributes {
}

export type DirAttributes = DirSpecificAttributes & CommonProps<HTMLDirectoryElement>
