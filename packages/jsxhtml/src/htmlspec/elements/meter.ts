import type {CommonProps} from '../../jsx-types'

export interface MeterSpecificAttributes {
}

export type MeterAttributes = MeterSpecificAttributes & CommonProps<HTMLMeterElement>
