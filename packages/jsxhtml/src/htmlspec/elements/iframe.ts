import type {CommonProps} from '../../jsx-types'

export interface IframeSpecificAttributes {
}

export type IframeAttributes = IframeSpecificAttributes & CommonProps<HTMLIFrameElement>
