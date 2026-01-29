import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'

export interface InsAttributes extends CommonAttributes<ElementForTag<'ins'>> {
    /**
     * This attribute defines the URI of a resource that explains the change, such as a link to meeting minutes or a ticket in a troubleshooting system.
     */
    cite?: string
    /**
     * This attribute indicates the time and date of the change and must be a valid date with an optional time string. If the value cannot be parsed as a date with an optional time string, the element does not have an associated timestamp. For the format of the string without a time, see [Format of a valid date string](/en-US/docs/Web/HTML/Guides/Date_and_time_formats#date_strings). The format of the string if it includes both date and time is covered in [Format of a valid local date and time string](/en-US/docs/Web/HTML/Guides/Date_and_time_formats#local_date_and_time_strings).
     */
    datetime?: string
}

