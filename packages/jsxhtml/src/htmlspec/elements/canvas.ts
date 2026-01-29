import type {CommonProps} from '../../jsx-types'

export interface CanvasSpecificAttributes {
}

export type CanvasAttributes = CanvasSpecificAttributes & CommonProps<HTMLCanvasElement>
