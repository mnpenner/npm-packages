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
    /**
     * The <abbr> HTML element represents an abbreviation or acronym.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/abbr
     */
    abbr: AnyAttributes,
    /**
     * @deprecated Use the `<abbr>` element instead.
     */
    acronym: AnyAttributes,
    /**
     * The <address> HTML element indicates that the enclosed HTML provides contact information for a person or people,
     * or for an organization. [9]
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/address
     */
    address: AnyAttributes,
    /**
     * The <area> HTML element defines an area inside an image map that has predefined clickable areas.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/area
     */
    area: AnyAttributes<HTMLAreaElement>,
    /**
     * The <article> HTML element represents a self-contained composition in a document, page, application, or site,
     * which is intended to be independently distributable or reusable (e.g., in syndication).
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/article
     */
    article: AnyAttributes,
    /**
     * The <aside> HTML element represents a portion of a document whose content is only indirectly related to the
     * document's main content.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/aside
     */
    aside: AnyAttributes,
    /**
     * The <audio> HTML element is used to embed sound content in documents. It may contain one or more audio sources,
     * represented using the src attribute or the <source> element: the browser will choose the most suitable one.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/audio
     */
    audio: AnyAttributes<HTMLAudioElement>,
    /**
     * The <b> HTML element is used to draw the reader's attention to the element's contents, which are not otherwise
     * granted any special importance.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/b
     */
    b: AnyAttributes,
    /**
     * The <base> HTML element specifies the base URL to use for all relative URLs in a document. [3]
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/base
     */
    base: AnyAttributes<HTMLBaseElement>,
    /**
     * The <bdi> HTML element tells the browser's bidirectional algorithm to treat the text it contains in isolation
     * from its surroundings. [4]
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/bdi
     */
    bdi: AnyAttributes,
    /**
     * The <bdo> HTML element overrides the current directionality of text, so that the text within is rendered in a
     * different direction. [18]
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/bdo
     */
    bdo: AnyAttributes,
    /**
     * @deprecated
     */
    big: AnyAttributes,
    /**
     * The <blockquote> HTML element indicates that the enclosed text is an extended quotation.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/blockquote
     */
    blockquote: AnyAttributes<HTMLQuoteElement>,
    /**
     * The <body> HTML element represents the content of an HTML document. There can be only one <body> element in a
     * document.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/body
     */
    body: AnyAttributes<HTMLBodyElement>,
    /**
     * The <br> HTML element produces a line break in text (carriage-return). [8]
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/br
     */
    br: AnyAttributes<HTMLBRElement>,
    /**
     * The <button> HTML element is an interactive element activated by a user with a mouse, keyboard, finger, voice
     * command, or other assistive technology. Once activated, it then performs an action, such as submitting a form or
     * opening a dialog.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/button
     */
    button: ButtonAttributes & CommonProps<HTMLButtonElement>,
    /**
     * The <canvas> HTML element is used to draw graphics, on the fly, via JavaScript.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/canvas
     */
    canvas: AnyAttributes<HTMLCanvasElement>,
    /**
     * The <caption> HTML element specifies the caption (or title) of a table.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/caption
     */
    caption: AnyAttributes<HTMLTableCaptionElement>,
    /**
     * @deprecated
     */
    center: AnyAttributes,
    /**
     * The <cite> HTML element is used to describe a reference to a cited creative work, and must include the title of
     * that work. [4]
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/cite
     */
    cite: AnyAttributes,
    /**
     * The <code> HTML element displays its contents styled in a fashion intended to indicate that the text is a short
     * fragment of computer code.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/code
     */
    code: AnyAttributes,
    /**
     * The <col> HTML element defines a column within a table and is used for defining common semantics on all common
     * cells. It is generally found within a <colgroup> element.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/col
     */
    col: AnyAttributes<HTMLTableColElement>,
    /**
     * The <colgroup> HTML element defines a group of columns within a table.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/colgroup
     */
    colgroup: AnyAttributes<HTMLTableColElement>,
    /**
     * The <data> HTML element links a given piece of content with a machine-readable translation.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/data
     */
    data: AnyAttributes<HTMLDataElement>,
    /**
     * The <datalist> HTML element contains a set of <option> elements that represent the permissible or recommended
     * options available to choose from within other controls.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/datalist
     */
    datalist: AnyAttributes<HTMLDataListElement>,
    /**
     * The <dd> HTML element provides the description, definition, or value for the preceding term (<dt>) in a
     * description list (<dl>). [17]
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dd
     */
    dd: AnyAttributes,
    /**
     * The <del> HTML element represents a range of text that has been deleted from a document. [11]
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/del
     */
    del: AnyAttributes<HTMLModElement>,
    /**
     * The <details> HTML element creates a disclosure widget in which information is visible only when the widget is
     * toggled into an "open" state.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/details
     */
    details: AnyAttributes<HTMLDetailsElement>,
    /**
     * The <dfn> HTML element is used to indicate the term being defined within the context of a definition phrase or
     * sentence. [15]
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dfn
     */
    dfn: AnyAttributes,
    /**
     * The <dialog> HTML element represents a dialog box or other interactive component, such as a dismissible alert,
     * inspector, or subwindow.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog
     */
    dialog: AnyAttributes<HTMLDialogElement>,
    /**
     * The `<dir>` HTML element is used as a container for a directory of files and/or folders.
     * @deprecated Use the `<ul>` element instead.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dir
     */
    dir: AnyAttributes<HTMLDirectoryElement>,
    /**
     * The <div> HTML element is the generic container for flow content. It has no effect on the content or layout
     * until styled using CSS. [3]
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/div
     */
    div: AnyAttributes<HTMLDivElement>,
    /**
     * The <dl> HTML element represents a description list. The element encloses a list of groups of terms (specified
     * using the <dt> element) and descriptions (provided by <dd> elements). [19]
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dl
     */
    dl: AnyAttributes<HTMLDListElement>,
    /**
     * The <dt> HTML element specifies a term in a description or definition list, and as such must be used inside a
     * <dl> element. [12]
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dt
     */
    dt: AnyAttributes,
    /**
     * The <em> HTML element marks text that has stress emphasis. [15]
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/em
     */
    em: AnyAttributes,
    /**
     * The <embed> HTML element embeds external content at the specified point in the document. This content is
     * provided by an external application or other source of interactive content such as a browser plug-in.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/embed
     */
    embed: AnyAttributes<HTMLEmbedElement>,
    /**
     * The <fieldset> HTML element is used to group several controls as well as labels (<label>) within a web form.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/fieldset
     */
    fieldset: AnyAttributes<HTMLFieldSetElement>,
    /**
     * The <figcaption> HTML element represents a caption or legend describing the rest of the contents of its parent
     * <figure> element. [12]
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/figcaption
     */
    figcaption: AnyAttributes,
    /**
     * The <figure> HTML element represents self-contained content, potentially with an optional caption, which is
     * specified using the (<figcaption>) element. [7]
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/figure
     */
    figure: AnyAttributes,
    /**
     * @deprecated
     */
    font: AnyAttributes<HTMLFontElement>,
    /**
     * The <footer> HTML element represents a footer for its nearest sectioning content or sectioning root element. A
     * <footer> typically contains information about the author of the section, copyright data or links to related
     * documents.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/footer
     */
    footer: AnyAttributes,
    /**
     * The <form> HTML element represents a document section containing interactive controls for submitting information.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form
     */
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
    /**
     * The <h1> to <h6> HTML elements represent six levels of section headings. <h1> is the highest section level and
     * <h6> is the lowest.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/Heading_Elements
     */
    h1: AnyAttributes<HTMLHeadingElement>,
    h2: AnyAttributes<HTMLHeadingElement>,
    h3: AnyAttributes<HTMLHeadingElement>,
    h4: AnyAttributes<HTMLHeadingElement>,
    h5: AnyAttributes<HTMLHeadingElement>,
    h6: AnyAttributes<HTMLHeadingElement>,
    /**
     * The <head> HTML element contains machine-readable information (metadata) about the document, like its title,
     * scripts, and style sheets. [1]
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/head
     */
    head: AnyAttributes<HTMLHeadElement>,
    /**
     * The <header> HTML element represents introductory content, typically a group of introductory or navigational
     * aids. It may contain some heading elements but also a logo, a search form, an author name, and other elements.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/header
     */
    header: AnyAttributes,
    /**
     * The <hgroup> HTML element represents a multi-level heading for a section of a document. It groups a set of
     * <h1>–<h6> elements.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/hgroup
     */
    hgroup: AnyAttributes,
    /**
     * The <hr> HTML element represents a thematic break between paragraph-level elements: for example, a change of
     * scene in a story, or a shift of topic within a section. [10]
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/hr
     */
    hr: AnyAttributes<HTMLHRElement>,
    /**
     * The <html> HTML element represents the root (top-level element) of an HTML document, so it is also referred to
     * as the root element. [1]
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/html
     */
    html: AnyAttributes<HTMLHtmlElement>,
    /**
     * The <i> HTML element represents a range of text that is set off from the normal text for some reason, such as
     * idiomatic text, technical terms, taxonomical designations, among others. [11]
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/i
     */
    i: AnyAttributes,
    /**
     * The <iframe> HTML element represents a nested browsing context, embedding another HTML page into the current one.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe
     */
    iframe: AnyAttributes<HTMLIFrameElement>,
    /**
     * The <img> HTML element embeds an image into the document.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img
     */
    img: AnyAttributes<HTMLImageElement>,
    /**
     * The `<input>` HTML element is used to create interactive controls for web-based forms in order to accept data
     * from the user; a wide variety of types of input data and control widgets are available, depending on the device
     * and user agent. The `<input>` element is one of the most powerful and complex in all of HTML due to the sheer
     * number of combinations of input types and attributes.
     */
    input: AnyAttributes<HTMLInputElement>,
    /**
     * The <ins> HTML element represents a range of text that has been added to a document. [2]
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/ins
     */
    ins: AnyAttributes<HTMLModElement>,
    /**
     * The <kbd> HTML element represents a span of inline text denoting textual user input from a keyboard, voice
     * input, or any other text entry device. [8]
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/kbd
     */
    kbd: AnyAttributes,
    /**
     * @deprecated
     */
    keygen: AnyAttributes,
    /**
     * The <label> HTML element represents a caption for an item in a user interface. [3]
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/label
     */
    label: AnyAttributes<HTMLLabelElement>,
    /**
     * The <legend> HTML element represents a caption for the content of its parent <fieldset>. [3]
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/legend
     */
    legend: AnyAttributes<HTMLLegendElement>,
    /**
     * The <li> HTML element is used to represent an item in a list. [13]
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/li
     */
    li: AnyAttributes<HTMLLIElement>,
    /**
     * The <link> HTML element specifies relationships between the current document and an external resource. This
     * element is most commonly used to link to stylesheets, but is also used to establish site icons. [3]
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/link
     */
    link: AnyAttributes<HTMLLinkElement>,
    /**
     * The <main> HTML element represents the dominant content of the <body> of a document.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/main
     */
    main: AnyAttributes,
    /**
     * The <map> HTML element is used with <area> elements to define an image map (a clickable link area).
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/map
     */
    map: AnyAttributes<HTMLMapElement>,
    /**
     * The <mark> HTML element represents text which is marked or highlighted for reference or notation purposes, due
     * to the marked passage's relevance or importance in the enclosing context.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/mark
     */
    mark: AnyAttributes,
    /**
     * The `<marquee>` HTML element is used to insert a scrolling area of text.
     * @deprecated Use CSS animations instead.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/marquee
     */
    marquee: AnyAttributes<HTMLMarqueeElement>,
    /**
     * The <menu> HTML element is a semantic alternative to <ul>. It represents an unordered list of items (which are
     * represented by <li> elements).
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/menu
     */
    menu: AnyAttributes<HTMLMenuElement>,
    /**
     * The `<menuitem>` HTML element defines a command/menu item that the user can invoke from a popup menu.
     * @deprecated
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/menuitem
     */
    menuitem: AnyAttributes,
    /**
     * The <meta> HTML element represents metadata that cannot be represented by other HTML meta-related elements, like
     * <base>, <link>, <script>, <style> or <title>. [3]
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/meta
     */
    meta: AnyAttributes<HTMLMetaElement>,
    /**
     * The <meter> HTML element represents either a scalar value within a known range or a fractional value. [3]
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/meter
     */
    meter: AnyAttributes<HTMLMeterElement>,
    /**
     * The <nav> HTML element represents a section of a page whose purpose is to provide navigation links, either
     * within the current document or to other documents. Common examples of navigation sections are menus, tables of
     * contents, and indexes.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/nav
     */
    nav: AnyAttributes,
    /**
     * @deprecated
     */
    nobr: AnyAttributes,
    /**
     * The `<noembed>` HTML element is an obsolete, non-standard way to provide alternative, or "fallback", content for
     * browsers that do not support the `<embed>` element.
     * @deprecated Use the `<object>` element instead.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/noembed
     */
    noembed: AnyAttributes,
    /**
     * The `<noframes>` element provides content to be displayed in browsers that do not support, or are configured not
     * to support, the `<frame>` element.
     * @deprecated
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/noframes
     */
    noframes: AnyAttributes,
    /**
     * The <noscript> HTML element defines a section of HTML to be inserted if a script type on the page is unsupported
     * or if scripting is currently turned off in the browser.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/noscript
     */
    noscript: AnyAttributes,
    /**
     * The <object> HTML element represents an external resource, which can be treated as an image, a nested browsing
     * context, or a resource to be handled by a plugin.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/object
     */
    object: AnyAttributes<HTMLObjectElement>,
    /**
     * The <ol> HTML element represents an ordered list of items — typically rendered as a numbered list.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/ol
     */
    ol: AnyAttributes<HTMLOListElement>,
    /**
     * The <optgroup> HTML element creates a grouping of options within a <select> element. [3]
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/optgroup
     */
    optgroup: AnyAttributes<HTMLOptGroupElement>,
    /**
     * The <option> HTML element is used to define an item contained in a <select>, an <optgroup>, or a <datalist>
     * element. As such, <option> can represent menu items in popups and other lists of items in an HTML document. [3]
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/option
     */
    option: AnyAttributes<HTMLOptionElement>,
    /**
     * The <output> HTML element is a container element into which a site or app can inject the results of a
     * calculation or the outcome of a user action.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/output
     */
    output: AnyAttributes<HTMLOutputElement>,
    /**
     * The <p> HTML element represents a paragraph. [3]
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/p
     */
    p: AnyAttributes<HTMLParagraphElement>,
    /**
     * The `<param>` HTML element defines parameters for an `<object>` element.
     * @deprecated
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/param
     */
    param: AnyAttributes<HTMLParamElement>,
    /**
     * The <picture> HTML element contains zero or more <source> elements and one <img> element to offer alternative
     * versions of an image for different display/device scenarios.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/picture
     */
    picture: AnyAttributes<HTMLPictureElement>,
    /**
     * The `<plaintext>` HTML element renders everything following the start tag as raw text, ignoring any following
     * HTML.
     * @deprecated Use the `<pre>` or `<code>` element instead, or serve a text file with the `text/plain` MIME type.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/plaintext
     */
    plaintext: AnyAttributes,
    /**
     * The <pre> HTML element represents preformatted text which is to be presented exactly as written in the HTML
     * file. [3]
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/pre
     */
    pre: AnyAttributes<HTMLPreElement>,
    /**
     * The <progress> HTML element displays an indicator showing the completion progress of a task, typically displayed
     * as a progress bar.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/progress
     */
    progress: AnyAttributes<HTMLProgressElement>,
    /**
     * The <q> HTML element indicates that the enclosed text is a short inline quotation. [10]
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/q
     */
    q: AnyAttributes<HTMLQuoteElement>,
    /**
     * The `<rb>` HTML element is used to delimit the base text component of a `<ruby>` annotation.
     * @deprecated
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/rb
     */
    rb: AnyAttributes,
    /**
     * The <rp> HTML element is used to provide fall-back parentheses for browsers that do not support the display of
     * ruby annotations using the <ruby> element. [9]
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/rp
     */
    rp: AnyAttributes,
    /**
     * The <rt> HTML element specifies the ruby text component of a ruby annotation, which is used to provide
     * pronunciation, translation, or transliteration information for East Asian typography. The <rt> element must
     * always be contained within a <ruby> element.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/rt
     */
    rt: AnyAttributes,
    /**
     * @deprecated
     */
    rtc: AnyAttributes,
    /**
     * The <ruby> HTML element represents small annotations that are rendered above, below, or next to base text,
     * usually used for showing the pronunciation of East Asian characters. [14]
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/ruby
     */
    ruby: AnyAttributes,
    /**
     * The <s> HTML element renders text with a strikethrough, or a line through it. Use the <s> element to represent
     * things that are no longer relevant or no longer accurate. [14]
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/s
     */
    s: AnyAttributes,
    /**
     * The <samp> HTML element is used to enclose inline text which represents sample (or quoted) output from a
     * computer program. [20]
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/samp
     */
    samp: AnyAttributes,
    /**
     * The <script> HTML element is used to embed executable code or data; this is typically used to embed or refer to
     * JavaScript code. The <script> element can also be used with other languages, such as WebGL's GLSL shader
     * programming language and JSON.
     */
    script: ScriptElementAttributes,
    /**
     * The <search> HTML element is a container for a part of a document or application that contains form controls or
     * other content related to performing a search or filtering operation.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/search
     */
    search: AnyAttributes,
    /**
     * The <section> HTML element represents a generic standalone section of a document, which doesn't have a more
     * specific semantic element to represent it.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/section
     */
    section: AnyAttributes,
    /**
     * The <select> HTML element represents a control that provides a menu of options.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/select
     */
    select: AnyAttributes<HTMLSelectElement>,
    /**
     * The <slot> HTML element—part of the Web Components technology suite—is a placeholder inside a web component that
     * you can fill with your own markup, which lets you create separate DOM trees and present them together.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/slot
     */
    slot: AnyAttributes<HTMLSlotElement>,
    /**
     * The <small> HTML element represents side-comments and small print, like copyright and legal text, independent of
     * its styled presentation. [7]
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/small
     */
    small: AnyAttributes,
    /**
     * The <source> HTML element specifies multiple media resources for the <picture>, the <audio> element, or the
     * <video> element.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/source
     */
    source: AnyAttributes<HTMLSourceElement>,
    /**
     * The <span> HTML element is a generic inline container for phrasing content, which does not inherently represent
     * anything. It can be used to group elements for styling purposes (using the class or id attributes), or because
     * they share attribute values, such as lang.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/span
     */
    span: AnyAttributes<HTMLSpanElement>,
    /**
     * @deprecated Use the `<del>` or `<s>` element instead.
     */
    strike: AnyAttributes,
    /**
     * The <strong> HTML element indicates that its contents have strong importance, seriousness, or urgency. Browsers
     * typically render the contents in bold type.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/strong
     */
    strong: AnyAttributes,
    /**
     * The <style> HTML element contains style information for a document, or part of a document. [3]
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/style
     */
    style: StyleHTMLAttributes,
    /**
     * The <sub> HTML element specifies inline text which should be displayed as subscript for solely typographical
     * reasons.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/sub
     */
    sub: AnyAttributes,
    /**
     * The <summary> HTML element specifies a summary, caption, or legend for a <details> element's disclosure box.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/summary
     */
    summary: AnyAttributes,
    /**
     * The <sup> HTML element specifies inline text which is to be displayed as superscript for solely typographical
     * reasons.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/sup
     */
    sup: AnyAttributes,
    /**
     * The <table> HTML element represents tabular data — that is, information presented in a two-dimensional table
     * comprised of rows and columns of cells containing data.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/table
     */
    table: AnyAttributes<HTMLTableElement>,
    /**
     * The <tbody> HTML element encapsulates a set of table rows (<tr> elements), indicating that they comprise the
     * body of the table (<table>).
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/tbody
     */
    tbody: AnyAttributes<HTMLTableSectionElement>,
    /**
     * The <td> HTML element defines a cell of a table that contains data. [3]
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/td
     */
    td: AnyAttributes<HTMLTableCellElement>,
    /**
     * The <template> HTML element is a mechanism for holding HTML that is not to be rendered immediately when a page
     * is loaded but may be instantiated subsequently during runtime using JavaScript.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/template
     */
    template: AnyAttributes<HTMLTemplateElement>,
    /**
     * The <textarea> HTML element represents a multi-line plain-text editing control, useful when you want to allow
     * users to enter a sizeable amount of free-form text, for example a comment on a review or feedback form.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/textarea
     */
    textarea: AnyAttributes<HTMLTextAreaElement>,
    /**
     * The <tfoot> HTML element defines a set of rows summarizing the columns of the table. [3]
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/tfoot
     */
    tfoot: AnyAttributes<HTMLTableSectionElement>,
    /**
     * The <th> HTML element defines a cell as header of a group of table cells. [3]
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/th
     */
    th: AnyAttributes<HTMLTableCellElement>,
    /**
     * The <thead> HTML element defines a set of rows defining the head of the columns of the table. [3]
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/thead
     */
    thead: AnyAttributes<HTMLTableSectionElement>,
    /**
     * The <time> HTML element represents a specific period in time.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/time
     */
    time: AnyAttributes<HTMLTimeElement>,
    /**
     * The <title> HTML element defines the document's title that is shown in a browser's title bar or a page's tab. [3]
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/title
     */
    title: AnyAttributes<HTMLTitleElement>,
    /**
     * The <tr> HTML element defines a row of cells in a table. [3]
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/tr
     */
    tr: AnyAttributes<HTMLTableRowElement>,
    /**
     * The <track> HTML element is used as a child of the media elements, <audio> and <video>. It lets you specify
     * timed text tracks (or time-based data), for example to automatically handle subtitles.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/track
     */
    track: AnyAttributes<HTMLTrackElement>,
    /**
     * @deprecated Use the `<code>` element or CSS for monospaced text instead.
     */
    tt: AnyAttributes,
    /**
     * The <u> HTML element represents a span of inline text which should be rendered in a way that indicates that it
     * has a non-textual annotation.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/u
     */
    u: AnyAttributes,
    /**
     * The <ul> HTML element represents an unordered list of items, typically rendered as a bulleted list.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/ul
     */
    ul: AnyAttributes<HTMLUListElement>,
    /**
     * The <var> HTML element represents the name of a variable in a mathematical expression or a programming context.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/var
     */
    var: AnyAttributes,
    /**
     * The <video> HTML element embeds a media player which supports video playback into the document.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video
     */
    video: AnyAttributes<HTMLVideoElement>,
    /**
     * The <wbr> HTML element represents a word break opportunity—a position within text where the browser may
     * optionally break a line, though its line-breaking rules would not otherwise create a break at that location.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/wbr
     */
    wbr: AnyAttributes,
    /**
     * The `<xmp>` HTML element renders text between the start and end tags without interpreting the HTML in between
     * and using a monospaced font.
     * @deprecated Use the `<pre>` or `<code>` element instead.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/xmp
     */
    xmp: AnyAttributes<HTMLPreElement>,
}
