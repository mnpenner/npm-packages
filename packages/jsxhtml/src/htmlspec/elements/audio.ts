import type {CommonProps} from '../../jsx-types'

export interface AudioSpecificAttributes {
}

export type AudioAttributes = AudioSpecificAttributes & CommonProps<HTMLAudioElement>
