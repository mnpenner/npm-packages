import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'
import type {Numeric} from '../attributes/StandardGlobalAttributes'

export interface SourceAttributes extends CommonAttributes<ElementForTag<'source'>> {
    /**
     * Specifies the MIME media type of the image or other media type, optionally including a `codecs` parameter.
     */
    type?: string
    /**
     * Specifies a comma-separated list of one or more image URLs and their descriptors. Required if the parent of `<source ` is picture. Not allowed if the parent is audio or video. The list consists of strings separated by commas, indicating a set of possible images for the browser to use. Each string is composed of: Each string in the list must have either a width descriptor or a pixel density descriptor to be valid. These two descriptors should not be used together; only one should be used consistently throughout the list. The value of each descriptor in the list must be unique. The browser chooses the most adequate image to display at a given point of time based on these descriptors. If the descriptors are not specified, the default value used is `1x`. If the `sizes` attribute is also present, then each string must include a width descriptor. If the browser does not support `srcset`, then `src` will be used for the default image source.
     */
    srcset?: string
    /**
     * Specifies the URL of the media resource. Required if the parent of `<source ` is audio or video. Not allowed if the parent is picture.
     */
    src?: string
    /**
     * Specifies a list of source sizes that describe the final rendered width of the image. Allowed if the parent of `<source ` is picture. Not allowed if the parent is audio or video. The list consists of source sizes separated by commas. Each source size is media condition-length pair. Before laying the page out, the browser uses this information to determine which image defined in `srcset` to display. Note that `sizes` will take effect only if width descriptors are provided with `srcset`, not pixel density descriptors (i.e., `200w` should be used instead of `2x`).
     */
    sizes?: string
    /**
     * Specifies the media query for the resource's intended media.
     */
    media?: string
    /**
     * Specifies the intrinsic height of the image in pixels. Allowed if the parent of `<source ` is a picture. Not allowed if the parent is audio or video. The height value must be an integer without any units.
     */
    height?: Numeric
    /**
     * Specifies the intrinsic width of the image in pixels. Allowed if the parent of `<source ` is a picture. Not allowed if the parent is audio or video. The width value must be an integer without any units.
     */
    width?: Numeric

}