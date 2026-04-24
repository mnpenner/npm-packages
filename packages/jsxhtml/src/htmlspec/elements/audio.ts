import type {CommonAttributes, CrossOrigin} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'

export interface AudioAttributes extends CommonAttributes<ElementForTag<'audio'>> {
    /**
     * A Boolean attribute: if specified, the audio will automatically begin playback as soon as it can do so, without waiting for the entire audio file to finish downloading.
     */
    autoplay?: boolean
    /**
     * If this attribute is present, the browser will offer controls to allow the user to control audio playback, including volume, seeking, and pause/resume playback.
     */
    controls?: boolean
    /**
     * The `controlslist` attribute, when specified, helps the browser select what controls to show for the `audio` element whenever the browser shows its own set of controls (that is, when the `controls` attribute is specified). The allowed values are `nodownload`, `nofullscreen` and `noremoteplayback`.
     */
    controlslist?: 'anonymous' | 'use-credentials'
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
     * A Boolean attribute used to disable the capability of remote playback in devices that are attached using wired (HDMI, DVI, etc.) and wireless technologies (Miracast, Chromecast, DLNA, AirPlay, etc.). See the proposed Remote Playback API specification for more information. In Safari, you can use `x-webkit-airplay="deny"` as a fallback.
     */
    disableremoteplayback?: string
    /**
     * A Boolean attribute: if specified, the audio player will automatically seek back to the start upon reaching the end of the audio.
     */
    loop?: boolean
    /**
     * A Boolean attribute that indicates whether the audio will be initially silenced. Its default value is `false`.
     */
    muted?: boolean
    /**
     * This enumerated attribute is intended to provide a hint to the browser about what the author thinks will lead to the best user experience. It may have one of the following values: The default value is different for each browser. The spec advises it to be set to `metadata`.
     *
     * Possible values:
     * - none
     * - metadata
     * - auto
     */
    preload?: 'none' | 'metadata' | 'auto'
    /**
     * The URL of the audio to embed. This is subject to HTTP access controls. This is optional; you may instead use the source element within the audio block to specify the audio to embed.
     */
    src?: string
}
