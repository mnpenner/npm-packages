import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'
import type {Numeric} from '../attributes/StandardGlobalAttributes'

export interface ProgressAttributes extends CommonAttributes<ElementForTag<'progress'>> {
    /**
     * This attribute describes how much work the task indicated by the `progress` element requires. The `max` attribute, if present, must have a value greater than `0` and be a valid floating point number. The default value is `1`.
     */
    max?: string | Numeric
    /**
     * This attribute specifies how much of the task that has been completed. It must be a valid floating point number between `0` and `max`, or between `0` and `1` if `max` is omitted. If there is no `value` attribute, the progress bar is indeterminate; this indicates that an activity is ongoing with no indication of how long it is expected to take.
     */
    value?: string | Numeric
}

