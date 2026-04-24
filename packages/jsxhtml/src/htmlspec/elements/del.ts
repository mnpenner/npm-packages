import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'

export interface DelAttributes extends CommonAttributes<ElementForTag<'del'>> {
    /**
     * A URI for a resource that explains the change (for example, meeting minutes).
     */
    cite?: string
    /**
     * This attribute indicates the time and date of the change and must be a valid date string with an optional time. If the value cannot be parsed as a date with an optional time string, the element does not have an associated timestamp. For the format of the string without a time, see Date strings. The format of the string if it includes both date and time is covered in Local date and time strings.
     */
    datetime?: string
}

