import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'

export interface AreaAttributes extends CommonAttributes<ElementForTag<'area'>> {
    /**
     * A text string alternative to display on browsers that do not display images. The text should be phrased so that it presents the user with the same kind of choice as the image would offer when displayed without the alternative text. This attribute is required only if the `href` attribute is used.
     */
    alt?: string
    /**
     * The `coords` attribute details the coordinates of the `shape` attribute in size, shape, and placement of an `<area `. This attribute must not be used if `shape` is set to `default`. The value specifies the coordinates of the top-left and bottom-right corner of the rectangle. For example, in `<area shape="rect" coords="0,0,253,27" href="#" target="_blank" alt="Mozilla" ` the coordinates are `0,0` and `253,27`, indicating the top-left and bottom-right corners of the rectangle, respectively. For example: `<area shape="circle" coords="130,136,60" href="#" target="_blank" alt="MDN" ` If the first and last coordinate pairs are not the same, the browser will add the last coordinate pair to close the polygon The values are numbers of CSS pixels. Our shape generator can help you generate the `coords` syntax by selecting points on an image you upload.
     *
     * Possible values:
     * - rect
     * - circle
     * - poly
     */
    coords?: 'rect' | 'circle' | 'poly'
    /**
     * This attribute, if present, indicates that the linked resource is intended to be downloaded rather than displayed in the browser. See a for a full description of the `download` attribute.
     */
    download?: string
    /**
     * The hyperlink target for the area. Its value is a valid URL. This attribute may be omitted; if so, the `<area ` element does not represent a hyperlink.
     */
    href?: string
    /**
     * Defines the `<area ` element as an **interest invoker**. Its value is the `id` of the target element, which will be affected in some way (normally shown or hidden) when interest is shown or lost on the invoker element (for example, by hovering/unhovering or focusing/blurring it). See Using interest invokers for more details and examples.
     * @experimental
     */
    interestfor?: string
    /**
     * Contains a space-separated list of URLs to which, when the hyperlink is followed, POST requests with the body `PING` will be sent by the browser (in the background). Typically used for tracking.
     */
    ping?: string
    /**
     * A string indicating which referrer to use when fetching the resource: **This value is unsafe**, because it leaks origins and paths from TLS-protected resources to insecure origins.
     *
     * Possible values:
     * - no-referrer
     * - no-referrer-when-downgrade
     * - origin
     * - origin-when-cross-origin
     * - same-origin
     * - strict-origin
     * - strict-origin-when-cross-origin
     * - unsafe-url
     */
    referrerpolicy?: 'no-referrer' | 'no-referrer-when-downgrade' | 'origin' | 'origin-when-cross-origin' | 'same-origin' | 'strict-origin' | 'strict-origin-when-cross-origin' | 'unsafe-url'
    /**
     * The **`rel`** attribute defines the relationship between a linked resource and the current document. Valid on link, a, area, and form, the supported values depend on the element on which the attribute is found.
     */
    rel?: string
    /**
     * The shape of the associated hot spot. The specifications for HTML defines the values `rect`, which defines a rectangular region; `circle`, which defines a circular region; `poly`, which defines a polygon; and `default`, which indicates the entire region beyond any defined shapes.
     */
    shape?: string
    /**
     * A keyword or author-defined name of the browsing context to display the linked resource. The following keywords have special meanings: If there is no parent, acts the same as `_self`. If there is no parent, acts the same as `_self`. Use this attribute only if the `href` attribute is present.
     *
     * Possible values:
     * - _self
     * - _blank
     * - _parent
     * - _top
     */
    target?: '_self' | '_blank' | '_parent' | '_top'
}

