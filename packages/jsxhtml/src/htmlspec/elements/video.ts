import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'
import type {Numeric} from '../attributes/StandardGlobalAttributes'

export interface VideoAttributes extends CommonAttributes<ElementForTag<'video'>> {
    /**
     * A Boolean attribute; if specified, the video automatically begins to play back as soon as it can without stopping to finish loading the data.
     * > [!NOTE]
     * > Modern browsers block audio (or videos with an unmuted audio track) from autoplaying, as sites that automatically play audio can be an unpleasant experience for users. See our [autoplay guide](/en-US/docs/Web/Media/Guides/Autoplay) for additional information about how to properly use autoplay.
     * To disable video autoplay, `autoplay="false"` will not work; the video will autoplay if the attribute is there in the `<video>` tag at all. To remove autoplay, the attribute needs to be removed altogether.
     */
    autoplay?: string
    /**
     * If this attribute is present, the browser will offer controls to allow the user to control video playback, including volume, seeking, and pause/resume playback.
     */
    controls?: string
    /**
     * The [`controlslist`](https://wicg.github.io/controls-list/explainer.html) attribute, when specified, helps the browser select what controls to show for the `video` element whenever the browser shows its own set of controls (that is, when the `controls` attribute is specified).
     * The allowed values are `nodownload`, `nofullscreen` and `noremoteplayback`.
     * Use the [`disablepictureinpicture`](#disablepictureinpicture) attribute if you want to disable the Picture-In-Picture mode (and the control).
     */
    controlslist?: string
    /**
     * This [enumerated](/en-US/docs/Glossary/Enumerated) attribute indicates whether to use CORS to fetch the related video. [CORS-enabled resources](/en-US/docs/Web/HTML/How_to/CORS_enabled_image) can be reused in the  element without being _tainted_. The allowed values are:
     */
    crossorigin?: string
    /**
     * Prevents the browser from suggesting a Picture-in-Picture context menu or to request Picture-in-Picture automatically in some cases.
     */
    disablepictureinpicture?: string
    /**
     * A Boolean attribute used to disable the capability of remote playback in devices that are attached using wired (HDMI, DVI, etc.) and wireless technologies (Miracast, Chromecast, DLNA, AirPlay, etc.).
     * In Safari, you can use [`x-webkit-airplay="deny"`](https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/AirPlayGuide/OptingInorOutofAirPlay/OptingInorOutofAirPlay.html) as a fallback.
     */
    disableremoteplayback?: string
    /**
     * The height of the video's display area, in [CSS pixels](https://drafts.csswg.org/css-values/#px) (absolute values only; [no percentages](https://html.spec.whatwg.org/multipage/embedded-content.html#dimension-attributes)).
     */
    height?: Numeric
    /**
     * A Boolean attribute; if specified, the browser will automatically seek back to the start upon reaching the end of the video.
     */
    loop?: string
    /**
     * A Boolean attribute that indicates the default audio mute setting contained in the video. If set, the audio will be initially silenced. Its default value is `false`, meaning the audio will be played when the video is played.
     */
    muted?: string
    /**
     * A Boolean attribute indicating that the video is to be played "inline", that is, within the element's playback area. Note that the absence of this attribute _does not_ imply that the video will always be played in fullscreen.
     */
    playsinline?: string
    /**
     * A URL for an image to be shown while the video is downloading. If this attribute isn't specified, nothing is displayed until the first frame is available, then the first frame is shown as the poster frame.
     */
    poster?: string
    /**
     * This  attribute is intended to provide a hint to the browser about what the author thinks will lead to the best user experience regarding what content is loaded before the video is played. It may have one of the following values:
     */
    preload?: string
    /**
     * The URL of the video to embed. This is optional; you may instead use the  element within the video block to specify the video to embed.
     */
    src?: string
    /**
     * The width of the video's display area, in [CSS pixels](https://drafts.csswg.org/css-values/#px) (absolute values only; [no percentages](https://html.spec.whatwg.org/multipage/embedded-content.html#dimension-attributes)).
     */
    width?: Numeric
}

