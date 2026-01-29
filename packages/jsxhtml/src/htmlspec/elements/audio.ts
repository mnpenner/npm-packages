import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'

export interface AudioAttributes extends CommonAttributes<ElementForTag<'audio'>> {
    /**
     * A Boolean attribute: if specified, the audio will automatically begin playback as soon as it can do so, without waiting for the entire audio file to finish downloading.
     * > [!NOTE]
     * > Sites that automatically play audio (or videos with an audio track) can be an unpleasant experience for users, so should be avoided when possible.
     * > If you must offer autoplay functionality, you should make it opt-in (requiring a user to specifically enable it).
     * > However, this can be useful when creating media elements whose source will be set at a later time, under user control.
     * > See our [autoplay guide](/en-US/docs/Web/Media/Guides/Autoplay) for additional information about how to properly use autoplay.
     */
    autoplay?: string
    /**
     * If this attribute is present, the browser will offer controls to allow the user to control audio playback, including volume, seeking, and pause/resume playback.
     */
    controls?: string
    /**
     * The [`controlslist`](https://wicg.github.io/controls-list/explainer.html) attribute, when specified, helps the browser select what controls to show for the `audio` element whenever the browser shows its own set of controls (that is, when the `controls` attribute is specified).
     * The allowed values are `nodownload`, `nofullscreen` and `noremoteplayback`.
     */
    controlslist?: string
    /**
     * This [enumerated](/en-US/docs/Glossary/Enumerated) attribute indicates whether to use CORS to fetch the related audio file. [CORS-enabled resources](/en-US/docs/Web/HTML/How_to/CORS_enabled_image) can be reused in the  element without being _tainted_. The allowed values are:
     */
    crossorigin?: string
    /**
     * A Boolean attribute used to disable the capability of remote playback in devices that are attached using wired (HDMI, DVI, etc.) and wireless technologies (Miracast, Chromecast, DLNA, AirPlay, etc.). See the proposed [Remote Playback API specification](https://w3c.github.io/remote-playback/#the-disableremoteplayback-attribute) for more information.
     * In Safari, you can use [`x-webkit-airplay="deny"`](https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/AirPlayGuide/OptingInorOutofAirPlay/OptingInorOutofAirPlay.html) as a fallback.
     */
    disableremoteplayback?: string
    /**
     * A Boolean attribute: if specified, the audio player will automatically seek back to the start upon reaching the end of the audio.
     */
    loop?: string
    /**
     * A Boolean attribute that indicates whether the audio will be initially silenced. Its default value is `false`.
     */
    muted?: string
    /**
     * This  attribute is intended to provide a hint to the browser about what the author thinks will lead to the best user experience. It may have one of the following values:
     */
    preload?: string
    /**
     * The URL of the audio to embed. This is subject to [HTTP access controls](/en-US/docs/Web/HTTP/Guides/CORS). This is optional; you may instead use the  element within the audio block to specify the audio to embed.
     */
    src?: string
}

