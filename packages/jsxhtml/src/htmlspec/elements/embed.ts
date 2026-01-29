import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'
import type {Numeric} from '../attributes/StandardGlobalAttributes'

export interface EmbedAttributes extends CommonAttributes<ElementForTag<'embed'>> {
    /**
     * The displayed height of the resource, in [CSS pixels](https://drafts.csswg.org/css-values/#px). This must be an absolute value; percentages are _not_ allowed.
     */
    height?: Numeric
    /**
     * The URL of the resource being embedded.
     */
    src?: string
    /**
     * The  to use to select the plug-in to instantiate.
     */
    type?: string
    /**
     * The displayed width of the resource, in [CSS pixels](https://drafts.csswg.org/css-values/#px). This must be an absolute value; percentages are _not_ allowed.
     */
    width?: Numeric
}

