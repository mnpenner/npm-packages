import type {CommonProps} from '../../jsx-types'

export interface VideoSpecificAttributes {
}

export type VideoAttributes = VideoSpecificAttributes & CommonProps<HTMLVideoElement>
