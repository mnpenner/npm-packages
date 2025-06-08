import type {AnyAttributes, CommonProps} from '../jsx-types'
import type {AnchorElement} from './AnchorElement'
import type {ScriptElementAttributes} from './ScriptElement'
import type {ButtonAttributes} from './ButtonElement'
import type {StyleHTMLAttributes} from './StyleAttributes'

export type IntrinsicElements = {
    /**
     * The <a> HTML element (or anchor element), with its href attribute, creates a hyperlink to web pages, files,
     * email addresses, locations in the same page, or anything else a URL can address.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a
     */
    a: AnchorElement & CommonProps<HTMLAnchorElement>,
    abbr: AnyAttributes,
    /**
     * @deprecated Use the `<abbr>` element instead.
     */
    acronym: AnyAttributes,
    address: AnyAttributes,
    area: AnyAttributes<HTMLAreaElement>,
    article: AnyAttributes,
    aside: AnyAttributes,
    audio: AnyAttributes<HTMLAudioElement>,
    b: AnyAttributes,
    base: AnyAttributes<HTMLBaseElement>,
    bdi: AnyAttributes,
    bdo: AnyAttributes,
    /**
     * @deprecated
     */
    big: AnyAttributes,
    blockquote: AnyAttributes<HTMLQuoteElement>,
    body: AnyAttributes<HTMLBodyElement>,
    br: AnyAttributes<HTMLBRElement>,
    button: ButtonAttributes  & CommonProps<HTMLButtonElement>,
    canvas: AnyAttributes<HTMLCanvasElement>,
    caption: AnyAttributes<HTMLTableCaptionElement>,
    /**
     * @deprecated
     */
    center: AnyAttributes,
    cite: AnyAttributes,
    code: AnyAttributes,
    col: AnyAttributes<HTMLTableColElement>,
    colgroup: AnyAttributes<HTMLTableColElement>,
    content: AnyAttributes,
    data: AnyAttributes<HTMLDataElement>,
    datalist: AnyAttributes<HTMLDataListElement>,
    dd: AnyAttributes,
    del: AnyAttributes<HTMLModElement>,
    details: AnyAttributes<HTMLDetailsElement>,
    dfn: AnyAttributes,
    dialog: AnyAttributes<HTMLDialogElement>,
    /**
     * The `<dir>` HTML element is used as a container for a directory of files and/or folders.
     * @deprecated Use the `<ul>` element instead.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dir
     */
    dir: AnyAttributes<HTMLDirectoryElement>,
    div: AnyAttributes<HTMLDivElement>,
    dl: AnyAttributes<HTMLDListElement>,
    dt: AnyAttributes,
    em: AnyAttributes,
    embed: AnyAttributes<HTMLEmbedElement>,
    fieldset: AnyAttributes<HTMLFieldSetElement>,
    figcaption: AnyAttributes,
    figure: AnyAttributes,
    /**
     * @deprecated
     */
    font: AnyAttributes<HTMLFontElement>,
    footer: AnyAttributes,
    form: AnyAttributes<HTMLFormElement>,
    /**
     * The `<frame>` HTML element defines a particular area in which another HTML document can be displayed.
     * A frame should be used within a `<frameset>`.
     * @deprecated Use `<iframe>` instead.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/frame
     */
    frame: AnyAttributes<HTMLFrameElement>,
    /**
     * The `<frameset>` HTML element is used to contain `<frame>` elements.
     * @deprecated Use `<iframe>` instead.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/frameset
     */
    frameset: AnyAttributes<HTMLFrameSetElement>,
    h1: AnyAttributes<HTMLHeadingElement>,
    h2: AnyAttributes<HTMLHeadingElement>,
    h3: AnyAttributes<HTMLHeadingElement>,
    h4: AnyAttributes<HTMLHeadingElement>,
    h5: AnyAttributes<HTMLHeadingElement>,
    h6: AnyAttributes<HTMLHeadingElement>,
    head: AnyAttributes<HTMLHeadElement>,
    header: AnyAttributes,
    hgroup: AnyAttributes,
    hr: AnyAttributes<HTMLHRElement>,
    html: AnyAttributes<HTMLHtmlElement>,
    i: AnyAttributes,
    iframe: AnyAttributes<HTMLIFrameElement>,
    image: AnyAttributes,
    img: AnyAttributes<HTMLImageElement>,
    /**
     * The `<input>` HTML element is used to create interactive controls for web-based forms in order to accept data
     * from the user; a wide variety of types of input data and control widgets are available, depending on the device
     * and user agent. The `<input>` element is one of the most powerful and complex in all of HTML due to the sheer
     * number of combinations of input types and attributes.
     */
    input: AnyAttributes<HTMLInputElement>,
    ins: AnyAttributes<HTMLModElement>,
    kbd: AnyAttributes,
    /**
     * @deprecated
     */
    keygen: AnyAttributes,
    label: AnyAttributes<HTMLLabelElement>,
    legend: AnyAttributes<HTMLLegendElement>,
    li: AnyAttributes<HTMLLIElement>,
    link: AnyAttributes<HTMLLinkElement>,
    main: AnyAttributes,
    map: AnyAttributes<HTMLMapElement>,
    mark: AnyAttributes,
    /**
     * The `<marquee>` HTML element is used to insert a scrolling area of text.
     * @deprecated Use CSS animations instead.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/marquee
     */
    marquee: AnyAttributes<HTMLMarqueeElement>,
    menu: AnyAttributes<HTMLMenuElement>,
    /**
     * The `<menuitem>` HTML element defines a command/menu item that the user can invoke from a popup menu.
     * @deprecated
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/menuitem
     */
    menuitem: AnyAttributes,
    meta: AnyAttributes<HTMLMetaElement>,
    meter: AnyAttributes<HTMLMeterElement>,
    nav: AnyAttributes,
    /**
     * @deprecated
     */
    nobr: AnyAttributes,
    /**
     * The `<noembed>` HTML element is an obsolete, non-standard way to provide alternative, or "fallback", content for browsers that do not support the `<embed>` element.
     * @deprecated Use the `<object>` element instead.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/noembed
     */
    noembed: AnyAttributes,
    /**
     * The `<noframes>` element provides content to be displayed in browsers that do not support, or are configured not to support, the `<frame>` element.
     * @deprecated
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/noframes
     */
    noframes: AnyAttributes,
    noscript: AnyAttributes,
    object: AnyAttributes<HTMLObjectElement>,
    ol: AnyAttributes<HTMLOListElement>,
    optgroup: AnyAttributes<HTMLOptGroupElement>,
    option: AnyAttributes<HTMLOptionElement>,
    output: AnyAttributes<HTMLOutputElement>,
    p: AnyAttributes<HTMLParagraphElement>,
    /**
     * The `<param>` HTML element defines parameters for an `<object>` element.
     * @deprecated
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/param
     */
    param: AnyAttributes<HTMLParamElement>,
    picture: AnyAttributes<HTMLPictureElement>,
    /**
     * The `<plaintext>` HTML element renders everything following the start tag as raw text, ignoring any following HTML.
     * @deprecated Use the `<pre>` or `<code>` element instead, or serve a text file with the `text/plain` MIME type.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/plaintext
     */
    plaintext: AnyAttributes,
    portal: AnyAttributes,
    pre: AnyAttributes<HTMLPreElement>,
    progress: AnyAttributes<HTMLProgressElement>,
    q: AnyAttributes<HTMLQuoteElement>,
    /**
     * The `<rb>` HTML element is used to delimit the base text component of a `<ruby>` annotation.
     * @deprecated
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/rb
     */
    rb: AnyAttributes,
    rp: AnyAttributes,
    rt: AnyAttributes,
    /**
     * @deprecated
     */
    rtc: AnyAttributes,
    ruby: AnyAttributes,
    s: AnyAttributes,
    samp: AnyAttributes,
    script: ScriptElementAttributes,
    search: AnyAttributes,
    section: AnyAttributes,
    select: AnyAttributes<HTMLSelectElement>,
    shadow: AnyAttributes,
    slot: AnyAttributes<HTMLSlotElement>,
    small: AnyAttributes,
    source: AnyAttributes<HTMLSourceElement>,
    span: AnyAttributes<HTMLSpanElement>,
    /**
     * @deprecated Use the `<del>` or `<s>` element instead.
     */
    strike: AnyAttributes,
    strong: AnyAttributes,
    style: StyleHTMLAttributes,
    sub: AnyAttributes,
    summary: AnyAttributes,
    sup: AnyAttributes,
    table: AnyAttributes<HTMLTableElement>,
    tbody: AnyAttributes<HTMLTableSectionElement>,
    td: AnyAttributes<HTMLTableCellElement>,
    template: AnyAttributes<HTMLTemplateElement>,
    textarea: AnyAttributes<HTMLTextAreaElement>,
    tfoot: AnyAttributes<HTMLTableSectionElement>,
    th: AnyAttributes<HTMLTableCellElement>,
    thead: AnyAttributes<HTMLTableSectionElement>,
    time: AnyAttributes<HTMLTimeElement>,
    title: AnyAttributes<HTMLTitleElement>,
    tr: AnyAttributes<HTMLTableRowElement>,
    track: AnyAttributes<HTMLTrackElement>,
    /**
     * @deprecated Use the `<code>` element or CSS for monospaced text instead.
     */
    tt: AnyAttributes,
    u: AnyAttributes,
    ul: AnyAttributes<HTMLUListElement>,
    var: AnyAttributes,
    video: AnyAttributes<HTMLVideoElement>,
    wbr: AnyAttributes,
    /**
     * The `<xmp>` HTML element renders text between the start and end tags without interpreting the HTML in between and using a monospaced font.
     * @deprecated Use the `<pre>` or `<code>` element instead.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/xmp
     */
    xmp: AnyAttributes<HTMLPreElement>,
}
