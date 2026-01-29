import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'
import type {Numeric} from '../attributes/StandardGlobalAttributes'

export interface SourceAttributes extends CommonAttributes<ElementForTag<'source'>> {
    /**
     * Specifies the [MIME media type of the image](/en-US/docs/Web/Media/Guides/Formats/Image_types) or [other media type](/en-US/docs/Web/Media/Guides/Formats/Containers), optionally including a [`codecs` parameter](/en-US/docs/Web/Media/Guides/Formats/codecs_parameter).
     */
    type?: string
    /**
     * Specifies the URL of the media resource. Required if the parent of `<source>` is  or . Not allowed if the parent is .
     */
    src?: string
    /**
     * Specifies a comma-separated list of one or more image URLs and their descriptors. Required if the parent of `<source>` is . Not allowed if the parent is  or .
     * The list consists of strings separated by commas, indicating a set of possible images for the browser to use. Each string is composed of:
     * - A URL specifying an image location.
     * - An optional width descriptor-a positive integer directly followed by `"w"`, such as `300w`.
     * - An optional pixel density descriptor-a positive floating number directly followed by `"x"`, such as `2x`.
     * Each string in the list must have either a width descriptor or a pixel density descriptor to be valid. These two descriptors should not be used together; only one should be used consistently throughout the list. The value of each descriptor in the list must be unique. The browser chooses the most adequate image to display at a given point of time based on these descriptors. If the descriptors are not specified, the default value used is `1x`. If the `sizes` attribute is also present, then each string must include a width descriptor. If the browser does not support `srcset`, then `src` will be used for the default image source.
     */
    srcset?: string
    /**
     * Specifies a list of source sizes that describe the final rendered width of the image. Allowed if the parent of `<source>` is . Not allowed if the parent is  or .
     * The list consists of source sizes separated by commas. Each source size is media condition-length pair. Before laying the page out, the browser uses this information to determine which image defined in [`srcset`](#srcset) to display. Note that `sizes` will take effect only if width descriptors are provided with `srcset`, not pixel density descriptors (i.e., `200w` should be used instead of `2x`).
     */
    sizes?: string
    /**
     * Specifies the [media query](/en-US/docs/Web/CSS/Guides/Media_queries) for the resource's intended media.
     */
    media?: string
    /**
     * Specifies the intrinsic height of the image in pixels. Allowed if the parent of `<source>` is a . Not allowed if the parent is  or .
     * The height value must be an integer without any units.
     */
    height?: Numeric
    /**
     * Specifies the intrinsic width of the image in pixels. Allowed if the parent of `<source>` is a . Not allowed if the parent is  or .
     * The width value must be an integer without any units.
     */
    width?: Numeric
}

