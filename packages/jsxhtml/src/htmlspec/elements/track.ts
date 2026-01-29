import type {CommonProps} from '../../jsx-types'

export interface TrackSpecificAttributes {
}

export type TrackAttributes = TrackSpecificAttributes & CommonProps<HTMLTrackElement>
