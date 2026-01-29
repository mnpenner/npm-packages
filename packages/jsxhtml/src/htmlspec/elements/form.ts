import type {CommonProps} from '../../jsx-types'

export interface FormSpecificAttributes {
}

export type FormAttributes = FormSpecificAttributes & CommonProps<HTMLFormElement>
