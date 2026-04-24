import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'
import type {Numeric} from '../attributes/StandardGlobalAttributes'

export interface MeterAttributes extends CommonAttributes<ElementForTag<'meter'>> {
    /**
     * The current numeric value. This must be between the minimum and maximum values (`min` attribute and `max` attribute) if they are specified. If unspecified or malformed, the value is `0`. If specified, but not within the range given by the `min` attribute and `max` attribute, the value is equal to the nearest end of the range.
     */
    value?: string | Numeric
    /**
     * The **`min`** attribute defines the minimum value that is acceptable and valid for the input containing the attribute. If the `value` of the element is less than this, the element fails validation. This value must be less than or equal to the value of the `max` attribute.
     */
    min?: string | Numeric
    /**
     * The **`max`** attribute defines the maximum value that is acceptable and valid for the input containing the attribute. If the `value` of the element is greater than this, the element fails validation. This value must be greater than or equal to the value of the `min` attribute. If the `max` attribute is present but is not specified or is invalid, no `max` value is applied. If the `max` attribute is valid and a non-empty value is greater than the maximum allowed by the `max` attribute, constraint validation will prevent form submission.
     */
    max?: string | Numeric
    /**
     * The upper numeric bound of the low end of the measured range. This must be greater than the minimum value (`min` attribute), and it also must be less than the high value and maximum value (`high` attribute and `max` attribute, respectively), if any are specified. If unspecified, or if less than the minimum value, the `low` value is equal to the minimum value.
     */
    low?: Numeric
    /**
     * The lower numeric bound of the high end of the measured range. This must be less than the maximum value (`max` attribute), and it also must be greater than the low value and minimum value (`low` attribute and `min` attribute, respectively), if any are specified. If unspecified, or if greater than the maximum value, the `high` value is equal to the maximum value.
     */
    high?: Numeric
    /**
     * This attribute indicates the optimal numeric value. It must be within the range (as defined by the `min` attribute and `max` attribute). When used with the `low` attribute and `high` attribute, it gives an indication where along the range is considered preferable. For example, if it is between the `min` attribute and the `low` attribute, then the lower range is considered preferred. The browser may color the meter's bar differently depending on whether the value is less than or equal to the optimum value.
     */
    optimum?: Numeric
}

