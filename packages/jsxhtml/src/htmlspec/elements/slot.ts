import type {CommonProps} from '../../jsx-types'

export interface SlotSpecificAttributes {
}

export type SlotAttributes = SlotSpecificAttributes & CommonProps<HTMLSlotElement>
