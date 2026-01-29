import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'

export interface AreaAttributes extends CommonAttributes<ElementForTag<'area'>> {
    /**
     * A text string alternative to display on browsers that do not display images.
     * The text should be phrased so that it presents the user with the same kind of choice as the image would offer when displayed without the alternative text.
     * This attribute is required only if the [`href`](#href) attribute is used.
     */
    alt?: string
    /**
     * The `coords` attribute details the coordinates of the [`shape`](#shape) attribute in size, shape, and placement of an `<area>`.
     * This attribute must not be used if `shape` is set to `default`.
     */
    coords?: string
    /**
     * This attribute, if present, indicates that the linked resource is intended to be downloaded rather than displayed in the browser.
     * See  for a full description of the [`download`](/en-US/docs/Web/HTML/Reference/Elements/a#download) attribute.
     */
    download?: string
    /**
     * The hyperlink target for the area.
     * Its value is a valid URL.
     * This attribute may be omitted; if so, the `<area>` element does not represent a hyperlink.
     */
    href?: string
    /**
     * Defines the `<area>` element as an **interest invoker**. Its value is the `id` of the target element, which will be affected in some way (normally shown or hidden) when interest is shown or lost on the invoker element (for example, by hovering/unhovering or focusing/blurring it). See [Using interest invokers](/en-US/docs/Web/API/Popover_API/Using_interest_invokers) for more details and examples.
     */
    interestfor?: string
    /**
     * Contains a space-separated list of URLs to which, when the hyperlink is followed,  requests with the body `PING` will be sent by the browser (in the background).
     * Typically used for tracking.
     */
    ping?: string
    /**
     * A string indicating which referrer to use when fetching the resource:
     */
    referrerpolicy?: string
    /**
     * For anchors containing the [`href`](#href) attribute, this attribute specifies the relationship of the target object to the link object.
     * The value is a space-separated list of link types.
     * The values and their semantics will be registered by some authority that might have meaning to the document author.
     * The default relationship, if no other is given, is void. Use this attribute only if the [`href`](#href) attribute is present.
     */
    rel?: string
    /**
     * The shape of the associated hot spot. The specifications for HTML defines the values `rect`, which defines a rectangular region; `circle`, which defines a circular region; `poly`, which defines a polygon; and `default`, which indicates the entire region beyond any defined shapes.
     */
    shape?: string
    /**
     * A keyword or author-defined name of the  to display the linked resource.
     * The following keywords have special meanings:
     */
    target?: string
}

