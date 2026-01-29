import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'

export interface TrackAttributes extends CommonAttributes<ElementForTag<'track'>> {
    /**
     * This attribute indicates that the track should be enabled unless the user's preferences indicate that another track is more appropriate. This may only be used on one `track` element per media element.
     */
    default?: string
    /**
     * How the text track is meant to be used. If omitted the default kind is `subtitles`. If the attribute contains an invalid value, it will use `metadata`.
     * The following keywords are allowed:
     */
    kind?: string
    /**
     * A user-readable title of the text track which is used by the browser when listing available text tracks.
     */
    label?: string
    /**
     * Address of the track (`.vtt` file). Must be a valid URL. This attribute must be specified and its URL value must have the same origin as the document - unless the  or  parent element of the `track` element has a [`crossorigin`](/en-US/docs/Web/HTML/Reference/Attributes/crossorigin) attribute.
     */
    src?: string
    /**
     * Language of the track text data. It must be a valid . If the `kind` attribute is set to `subtitles`, then `srclang` must be defined.
     */
    srclang?: string
}

