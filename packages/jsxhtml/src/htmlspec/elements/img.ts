import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'
import type {Numeric} from '../attributes/StandardGlobalAttributes'

export interface ImgAttributes extends CommonAttributes<ElementForTag<'img'>> {
    /**
     * Defines text that can replace the image in the page.
     * > [!NOTE]
     * > Browsers do not always display images. There are a number of situations in which a browser might not display images, such as:
     * >
     * > - Non-visual browsers (such as those used by people with visual impairments)
     * > - The user chooses not to display images (saving bandwidth, privacy reasons)
     * > - The image is invalid or an [unsupported type](#supported_image_formats)
     * >
     * > In these cases, the browser may replace the image with the text in the element's `alt` attribute. For these reasons and others, provide a useful value for `alt` whenever possible.
     * Setting this attribute to an empty string (`alt=""`) indicates that this image is _not_ a key part of the content (it's decoration or a tracking pixel), and that non-visual browsers may omit it from . Visual browsers will also hide the broken image icon if the `alt` attribute is empty and the image failed to display.
     * This attribute is also used when copying and pasting the image to text, or saving a linked image to a bookmark.
     */
    alt?: string
    /**
     * Indicates if the fetching of the image must be done using a  request. Image data from a [CORS-enabled image](/en-US/docs/Web/HTML/How_to/CORS_enabled_image) returned from a CORS request can be reused in the  element without being marked "[tainted](/en-US/docs/Web/HTML/How_to/CORS_enabled_image#security_and_tainted_canvases)".
     * If the `crossorigin` attribute is _not_ specified, then a non-CORS request is sent (without the  request header), and the browser marks the image as tainted and restricts access to its image data, preventing its usage in  elements.
     * If the `crossorigin` attribute _is_ specified, then a CORS request is sent (with the  request header); but if the server does not opt into allowing cross-origin access to the image data by the origin site (by not sending any  response header, or by not including the site's origin in any  response header it does send), then the browser blocks the image from loading, and logs a CORS error to the devtools console.
     * Allowed values:
     */
    crossorigin?: string
    /**
     * This attribute provides a hint to the browser as to whether it should perform image decoding along with rendering the other DOM content in a single presentation step that looks more "correct" (`sync`), or render and present the other DOM content first and then decode the image and present it later (`async`). In practice, `async` means that the next paint does not wait for the image to decode.
     * It is often difficult to perceive any noticeable effect when using `decoding` on static `<img>` elements. They'll likely be initially rendered as empty images while the image files are fetched (either from the network or from the cache) and then handled independently anyway, so the "syncing" of content updates is less apparent. However, the blocking of rendering while decoding happens, while often quite small, _can_ be measured - even if it is difficult to observe with the human eye. See [What does the image decoding attribute actually do?](https://www.tunetheweb.com/blog/what-does-the-image-decoding-attribute-actually-do/) for a more detailed analysis (tunetheweb.com, 2023).
     * Using different `decoding` types can result in more noticeable differences when dynamically inserting `<img>` elements into the DOM via JavaScript - see  for more details.
     * Allowed values:
     */
    decoding?: string
    /**
     * Marks the image for observation by the  API. The value given becomes an identifier for the observed image element. See also the [`elementtiming`](/en-US/docs/Web/HTML/Reference/Attributes/elementtiming) attribute page.
     */
    elementtiming?: string
    /**
     * Provides a hint of the relative priority to use when fetching the image. Allowed values:
     */
    fetchpriority?: string
    /**
     * The intrinsic height of the image, in pixels. Must be an integer without a unit.
     * > [!NOTE]
     * > Including `height` and [`width`](#width) enables the  of the image to be calculated by the browser prior to the image being loaded. This aspect ratio is used to reserve the space needed to display the image, reducing or even preventing a layout shift when the image is downloaded and painted to the screen. Reducing layout shift is a major component of good user experience and web performance.
     */
    height?: Numeric
    /**
     * This Boolean attribute indicates that the image is part of a [server-side map](https://en.wikipedia.org/wiki/Image_map#Server-side). If so, the coordinates where the user clicked on the image are sent to the server.
     * > [!NOTE]
     * > This attribute is allowed only if the `<img>` element is a descendant of an  element with a valid [`href`](/en-US/docs/Web/HTML/Reference/Elements/a#href) attribute. This gives users without pointing devices a fallback destination.
     */
    ismap?: string
    /**
     * Indicates how the browser should load the image:
     */
    loading?: string
    /**
     * A string indicating which referrer to use when fetching the resource:
     */
    referrerpolicy?: string
    /**
     * One or more values separated by commas, which can be source sizes or the `auto` keyword. The spec requires that the `sizes` attribute to only be present when `srcset` uses width descriptors.
     * A **source size** consists of:
     * 1. A [media condition](/en-US/docs/Web/CSS/Guides/Media_queries/Using#syntax), omitted for the last item in the list.
     * 2. A source size value.
     * Media conditions describe properties of the _viewport_, not the _image_. For example, `(height <= 500px) 1000px` proposes using an image source of 1000px width if the _viewport_ height is 500px or less. Because a source size descriptor specifies the width to use for the image during layout, the media condition is typically (but not necessarily) based on the .
     * Source size values specify the intended display size of the image.  use the current source size to select one of the sources supplied by the `srcset` attribute, when those sources are described using width (`w`) descriptors. The selected source size affects the  of the image (the image's display size if no  styling is applied).
     * A source size value can be any non-negative [length](/en-US/docs/Web/CSS/Reference/Values/length). It must not use CSS functions other than the [math functions](/en-US/docs/Web/CSS/Reference/Values/Functions#math_functions). Units are interpreted in the same way as [media queries](/en-US/docs/Web/CSS/Guides/Media_queries), meaning that all relative length units are relative to the document root rather than the `<img>` element. For example, an `em` value is relative to the root font size, not the font size of the image. [Percentage](/en-US/docs/Web/CSS/Reference/Values/percentage) values are not allowed. If the `sizes` attribute is not provided, it has a default value of `100vw` (the viewport width).
     * The `auto` keyword can replace the whole list of sizes or the first entry in the list. It is only valid when combined with `loading="lazy"`, and resolves to the [concrete size](/en-US/docs/Web/CSS/Reference/Values/image) of the image. Since the intrinsic size of the image is not yet known, `width` and `height` attributes (or CSS equivalents) should also be specified to prevent the browser from assuming the default image width of 300px.
     * For better backward compatibility with browsers that do not support `auto`, you can include fallback sizes after `auto` in the `sizes` attribute:
     * ```html
     * <img
     * loading="lazy"
     * width="200"
     * height="200"
     * sizes="auto, (max-width: 30em) 100vw, (max-width: 50em) 50vw, calc(33vw - 100px)"
     * srcset="
     * swing-200.jpg   200w,
     * swing-400.jpg   400w,
     * swing-800.jpg   800w,
     * swing-1600.jpg 1600w
     * "
     * src="swing-400.jpg"
     * alt="Kettlebell Swing" />
     * ```
     */
    sizes?: string
    /**
     * The image . At least one of `src` and [`srcset`](#srcset) is required for an `<img>` element. If [`srcset`](#srcset) is specified, `src` is used in one of two ways:
     * - as a fallback for browsers that don't support `srcset`.
     * - if `srcset` uses the "x" descriptor, then `src` is equivalent to a source with the density descriptor `1x`; that is, the image specified by `src` is used on low-density screens (such as typical 72 DPI or 96 DPI displays).
     */
    src?: string
    /**
     * One or more strings separated by commas, indicating possible image sources for the  to use.
     * Each string is composed of:
     * 1. A  to an image
     * 2. Optionally, whitespace followed by one of:
     * - A width descriptor (a positive integer directly followed by `w`). It _must_ match the intrinsic width of the referenced image. The width descriptor is divided by the source size given in the `sizes` attribute to calculate the effective pixel density. For example, to provide an image resource to be used when the renderer needs a 450 pixel wide image, use the width descriptor `450w`. When a `srcset` contains "w" descriptors, the browser uses those descriptors together with the `sizes` attribute to pick a resource.
     * - A pixel density descriptor (a positive floating point number directly followed by `x`). It specifies the condition in which the corresponding image resource should be used as the display's pixel density. For example, to provide an image resource to be used when the pixel density is double the standard density, use the pixel density descriptor `2x` or `2.0x`.
     * If no descriptor is specified, the source is assigned the default descriptor of `1x`. It is incorrect to mix width descriptors and pixel density descriptors in the same `srcset` attribute. Duplicate descriptors (for instance, two sources in the same `srcset` which are both described with `2x`) are also invalid.
     * Space characters, other than the whitespace separating the URL and the corresponding condition descriptor, are ignored; this includes both leading and trailing space, as well as space before or after each comma. However, if an image candidate string contains no descriptors and no whitespace after the URL, the following image candidate string, if there is one, must begin with one or more whitespace, or the comma will be considered part of the URL.
     * When the `<img>` element's `srcset` uses `x` descriptors, browsers also consider the URL in the `src` attribute (if present) as a candidate, and assign it a default descriptor of `1x`. On the other hand, if the `srcset` attribute uses width descriptors, `src` is not considered, and the `sizes` attribute is used instead.
     * The user agent selects any of the available sources at its discretion. This provides them with significant leeway to tailor their selection based on things like user preferences or  conditions. See our [Responsive images](/en-US/docs/Web/HTML/Guides/Responsive_images) tutorial for an example.
     */
    srcset?: string
    /**
     * The intrinsic width of the image in pixels. Must be an integer without a unit.
     */
    width?: Numeric
    /**
     * The partial  (starting with `#`) of an [image map](/en-US/docs/Web/HTML/Reference/Elements/map) associated with the element.
     * > [!NOTE]
     * > You cannot use this attribute if the `<img>` element is inside an  or  element.
     */
    usemap?: string
}

