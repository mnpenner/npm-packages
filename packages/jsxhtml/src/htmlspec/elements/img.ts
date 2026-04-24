import type {CommonAttributes, CrossOrigin} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'
import type {Numeric} from '../attributes/StandardGlobalAttributes'

export interface ImgAttributes extends CommonAttributes<ElementForTag<'img'>> {
    /**
     * Defines text that can replace the image in the page. Setting this attribute to an empty string (`alt=""`) indicates that this image is _not_ a key part of the content (it's decoration or a tracking pixel), and that non-visual browsers may omit it from rendering. Visual browsers will also hide the broken image icon if the `alt` attribute is empty and the image failed to display. This attribute is also used when copying and pasting the image to text, or saving a linked image to a bookmark.
     */
    alt?: string
    /**
     * The **`crossorigin`** attribute, valid on the audio, img, link, script, and video elements, provides support for CORS, defining how the element handles cross-origin requests, thereby enabling the configuration of the CORS requests for the element's fetched data. Depending on the element, the attribute can be a CORS settings attribute.
     *
     * Possible values:
     * - `anonymous`: Request uses CORS headers with credentials mode set to `same-origin` (no credentials sent for cross-origin requests).
     * - `use-credentials`: Request uses CORS headers with credentials mode set to `include` (credentials always sent).
     * - `""`: Setting the attribute to an empty value (or providing it without a value) is the same as `anonymous`.
     * - `true`: Boolean form; emits the attribute without a value (same as `""` / `anonymous`).
     */
    crossorigin?: CrossOrigin
    /**
     * This attribute provides a hint to the browser as to whether it should perform image decoding along with rendering the other DOM content in a single presentation step that looks more "correct" (`sync`), or render and present the other DOM content first and then decode the image and present it later (`async`). In practice, `async` means that the next paint does not wait for the image to decode. It is often difficult to perceive any noticeable effect when using `decoding` on static `<img ` elements. They'll likely be initially rendered as empty images while the image files are fetched (either from the network or from the cache) and then handled independently anyway, so the "syncing" of content updates is less apparent. However, the blocking of rendering while decoding happens, while often quite small, _can_ be measured - even if it is difficult to observe with the human eye. See What does the image decoding attribute actually do? for a more detailed analysis (tunetheweb.com, 2023). Using different `decoding` types can result in more noticeable differences when dynamically inserting `<img ` elements into the DOM via JavaScript - see HTMLImageElement.decoding for more details. Allowed values: Decode the image synchronously along with rendering the other DOM content, and present everything together. Decode the image asynchronously, after rendering and presenting the other DOM content. No preference for the decoding mode; the browser decides what is best for the user. This is the default value.
     *
     * Possible values:
     * - sync
     * - async
     * - auto
     */
    decoding?: 'sync' | 'async' | 'auto'
    /**
     * The **`elementtiming`** attribute is used to indicate that an element is flagged for tracking by PerformanceObserver objects using the `"element"` type. For more details, see the PerformanceElementTiming interface.
     */
    elementtiming?: string
    /**
     * The **`fetchpriority`** attribute allows a developer to signal that fetching a particular image early in the loading process has more or less impact on user experience than a browser can reasonably infer when assigning an internal priority. This in turn allows the browser to increase or decrease the priority, and potentially load the image earlier or later than it would otherwise.
     */
    fetchpriority?: 'high' | 'low' | 'auto'
    /**
     * The intrinsic height of the image, in pixels. Must be an integer without a unit.
     */
    height?: Numeric
    /**
     * This Boolean attribute indicates that the image is part of a server-side map. If so, the coordinates where the user clicked on the image are sent to the server.
     */
    ismap?: boolean
    /**
     * Indicates how the browser should load the image: Loads the image immediately, regardless of whether or not the image is currently within the visible viewport (this is the default value). Defers loading the image until it reaches a calculated distance from the viewport, as defined by the browser. The intent is to avoid the network and storage bandwidth needed to handle the image until it's reasonably certain that it will be needed. This generally improves the performance of the content in most typical use cases. While explicit `width` and `height` attributes are recommended for all images to avoid layout shift, they are especially important for lazy-loaded ones. Lazy-loaded images will never be loaded if they do not intersect a visible part of an element, even if loading them would change that, because unloaded images have a `width` and `height` of `0`. It creates an even more disruptive user experience when the content visible in the viewport reflows in the middle of reading it. The load event is fired after eager-loaded images have been fetched and processed, but before lazy-laded ones are, even if the lazy-loaded images are located within the visual viewport immediately upon initial page load. These images are still loaded as soon as layout completes; they just don't affect the timing of the `load` event. That means that when `load` fires, it's possible that any lazy-loaded images located in the visual viewport may not yet be visible. Loading is only deferred when JavaScript is enabled. This is an anti-tracking measure, because if a user agent supported lazy loading when scripting is disabled, it would still be possible for a site to track a user's approximate scroll position throughout a session, by strategically placing images in a page's markup such that a server can track how many images are requested and when.
     *
     * Possible values:
     * - eager
     * - lazy
     */
    loading?: 'eager' | 'lazy'
    /**
     * A string indicating which referrer to use when fetching the resource:
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
     * One or more values separated by commas, which can be source sizes or the `auto` keyword. The spec requires that the `sizes` attribute to only be present when `srcset` uses width descriptors. A **source size** consists of: 1. A media condition, omitted for the last item in the list. 2. A source size value. Media conditions describe properties of the _viewport_, not the _image_. For example, `(height <= 500px) 1000px` proposes using an image source of 1000px width if the _viewport_ height is 500px or less. Because a source size descriptor specifies the width to use for the image during layout, the media condition is typically (but not necessarily) based on the @media/width. Source size values specify the intended display size of the image. User agents use the current source size to select one of the sources supplied by the `srcset` attribute, when those sources are described using width (`w`) descriptors. The selected source size affects the intrinsic size of the image (the image's display size if no CSS styling is applied). A source size value can be any non-negative length. It must not use CSS functions other than the math functions. Units are interpreted in the same way as media queries, meaning that all relative length units are relative to the document root rather than the `<img ` element. For example, an `em` value is relative to the root font size, not the font size of the image. Percentage values are not allowed. If the `sizes` attribute is not provided, it has a default value of `100vw` (the viewport width). The `auto` keyword can replace the whole list of sizes or the first entry in the list. It is only valid when combined with `loading="lazy"`, and resolves to the concrete size of the image. Since the intrinsic size of the image is not yet known, `width` and `height` attributes (or CSS equivalents) should also be specified to prevent the browser from assuming the default image width of 300px. For better backward compatibility with browsers that do not support `auto`, you can include fallback sizes after `auto` in the `sizes` attribute:
     */
    sizes?: string
    /**
     * One or more strings separated by commas, indicating possible image sources for the user agent to use. Each string is composed of: 1. A URL to an image 2. Optionally, whitespace followed by one of: If no descriptor is specified, the source is assigned the default descriptor of `1x`. It is incorrect to mix width descriptors and pixel density descriptors in the same `srcset` attribute. Duplicate descriptors (for instance, two sources in the same `srcset` which are both described with `2x`) are also invalid. Space characters, other than the whitespace separating the URL and the corresponding condition descriptor, are ignored; this includes both leading and trailing space, as well as space before or after each comma. However, if an image candidate string contains no descriptors and no whitespace after the URL, the following image candidate string, if there is one, must begin with one or more whitespace, or the comma will be considered part of the URL. When the `<img ` element's `srcset` uses `x` descriptors, browsers also consider the URL in the `src` attribute (if present) as a candidate, and assign it a default descriptor of `1x`. On the other hand, if the `srcset` attribute uses width descriptors, `src` is not considered, and the `sizes` attribute is used instead. The user agent selects any of the available sources at its discretion. This provides them with significant leeway to tailor their selection based on things like user preferences or bandwidth conditions. See our Responsive images tutorial for an example.
     */
    srcset?: string
    /**
     * The image URL. At least one of `src` and `srcset` is required for an `<img ` element. If `srcset` is specified, `src` is used in one of two ways:
     */
    src?: string
    /**
     * The intrinsic width of the image in pixels. Must be an integer without a unit.
     */
    width?: Numeric
    /**
     * The partial URL (starting with `#`) of an image map associated with the element.
     */
    usemap?: string
    /**
     * Equivalent to `vertical-align: top` or `vertical-align: text-top` Equivalent to `vertical-align: -moz-middle-with-baseline` The default, equivalent to `vertical-align: unset` or `vertical-align: initial` Equivalent to `float: left` Equivalent to `float: right`
     *
     * Possible values:
     * - middle
     * - bottom
     * - left
     * - right
     */
    top?: 'middle' | 'bottom' | 'left' | 'right'

}
