import type {CommonProps} from '../../jsx-types'

export interface ObjectSpecificAttributes {
}

export type ObjectAttributes = ObjectSpecificAttributes & CommonProps<HTMLObjectElement>
