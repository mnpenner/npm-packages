import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'

export interface TrackAttributes extends CommonAttributes<ElementForTag<'track'>> {
    /**
     * This attribute indicates that the track should be enabled unless the user's preferences indicate that another track is more appropriate. This may only be used on one `track` element per media element.
     */
    default?: boolean
    /**
     * How the text track is meant to be used. If omitted the default kind is `subtitles`. If the attribute contains an invalid value, it will use `metadata`. The following keywords are allowed: Subtitles provide transcription or translation of the dialog. They are suitable for when the sound is available but not understood, such as speech or text that is not English in an English language film. Subtitles may contain additional content, usually extra background information. For example the text at the beginning of the Star Wars films, or the date, time, and location of a scene. Subtitles' information complements the audio and video. It is often embedded in the video itself, but can also be provided separately, especially for whole-film translations. Closed captions provide transcription or translation of the dialog, sound effects, relevant musical cues, and other relevant audio information, such as the cue's source (e.g., character, environment). They are suitable for when sound is unavailable or not clearly audible (e.g., because it is muted, drowned-out by ambient noise, or because the user is deaf). Descriptions summarize the _video_ component of the media resource. They are intended to be synthesized as audio when the visual component is obscured, unavailable, or not usable (e.g., because the user is interacting with the application without a screen while driving, or because the user is blind). Chapter titles are intended to be used when the user is navigating the media resource. Tracks used by scripts. Not visible to the user.
     *
     * Possible values:
     * - subtitles
     * - captions
     * - descriptions
     * - chapters
     * - metadata
     */
    kind?: 'subtitles' | 'captions' | 'descriptions' | 'chapters' | 'metadata'
    /**
     * A user-readable title of the text track which is used by the browser when listing available text tracks.
     */
    label?: string
    /**
     * Address of the track (`.vtt` file). Must be a valid URL. This attribute must be specified and its URL value must have the same origin as the document - unless the audio or video parent element of the `track` element has a `crossorigin` attribute.
     */
    src?: string
    /**
     * Language of the track text data. It must be a valid BCP 47 language tag. If the `kind` attribute is set to `subtitles`, then `srclang` must be defined.
     */
    srclang?: string

}