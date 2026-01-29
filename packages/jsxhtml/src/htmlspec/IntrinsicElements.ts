import type {AAttributes, AbbrAttributes, AddressAttributes, AreaAttributes, ArticleAttributes, AsideAttributes, AudioAttributes, BAttributes, BaseAttributes, BdiAttributes, BdoAttributes, BlockquoteAttributes, BodyAttributes, BrAttributes, ButtonAttributes, CanvasAttributes, CaptionAttributes, CiteAttributes, CodeAttributes, ColAttributes, ColgroupAttributes, DataAttributes, DatalistAttributes, DdAttributes, DelAttributes, DetailsAttributes, DfnAttributes, DialogAttributes, DivAttributes, DlAttributes, DtAttributes, EmAttributes, EmbedAttributes, FencedframeAttributes, FieldsetAttributes, FigcaptionAttributes, FigureAttributes, FooterAttributes, FormAttributes, H1Attributes, H2Attributes, H3Attributes, H4Attributes, H5Attributes, H6Attributes, HeadAttributes, HeaderAttributes, HgroupAttributes, HrAttributes, HtmlAttributes, IAttributes, IframeAttributes, ImgAttributes, InputAttributes, InsAttributes, KbdAttributes, LabelAttributes, LegendAttributes, LiAttributes, LinkAttributes, MainAttributes, MapAttributes, MarkAttributes, MenuAttributes, MetaAttributes, MeterAttributes, NavAttributes, NoscriptAttributes, ObjectAttributes, OlAttributes, OptgroupAttributes, OptionAttributes, OutputAttributes, PAttributes, PictureAttributes, PreAttributes, ProgressAttributes, QAttributes, RpAttributes, RtAttributes, RubyAttributes, SAttributes, SampAttributes, ScriptAttributes, SearchAttributes, SectionAttributes, SelectAttributes, SelectedcontentAttributes, SlotAttributes, SmallAttributes, SourceAttributes, SpanAttributes, StrongAttributes, StyleAttributes, SubAttributes, SummaryAttributes, SupAttributes, TableAttributes, TbodyAttributes, TdAttributes, TemplateAttributes, TextareaAttributes, TfootAttributes, ThAttributes, TheadAttributes, TimeAttributes, TitleAttributes, TrAttributes, TrackAttributes, UAttributes, UlAttributes, VarAttributes, VideoAttributes, WbrAttributes} from './elements'

export type IntrinsicElements = {
    /**
     * The <a> HTML element (or _anchor_ element), with its href attribute, creates a hyperlink to web pages, files, email addresses, locations in the same page, or anything else a URL can address.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a
     */
    a: AAttributes,
    /**
     * The <abbr> HTML element represents an abbreviation or acronym.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/abbr
     */
    abbr: AbbrAttributes,
    /**
     * The <address> HTML element indicates that the enclosed HTML provides contact information for a person or people, or for an organization.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/address
     */
    address: AddressAttributes,
    /**
     * The <area> HTML element defines an area inside an image map that has predefined clickable areas. An _image map_ allows geometric areas on an image to be associated with hypertext links.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/area
     */
    area: AreaAttributes,
    /**
     * The <article> HTML element represents a self-contained composition in a document, page, application, or site, which is intended to be independently distributable or reusable (e.g., in syndication). Examples include: a forum post, a magazine or newspaper article, or a blog entry, a product card, a user-submitted comment, an interactive widget or gadget, or any other independent item of content.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/article
     */
    article: ArticleAttributes,
    /**
     * The <aside> HTML element represents a portion of a document whose content is only indirectly related to the document's main content. Asides are frequently presented as sidebars or call-out boxes.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/aside
     */
    aside: AsideAttributes,
    /**
     * The <audio> HTML element is used to embed sound content in documents. It may contain one or more audio sources, represented using the src attribute or the <source> element: the browser will choose the most suitable one. It can also be the destination for streamed media, using a MediaStream.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/audio
     */
    audio: AudioAttributes,
    /**
     * The <b> HTML element is used to draw the reader's attention to the element's contents, which are not otherwise granted special importance. This was formerly known as the Boldface element, and most browsers still draw the text in boldface. However, you should not use <b> for styling text or granting importance. If you wish to create boldface text, you should use the CSS font-weight property. If you wish to indicate an element is of special importance, you should use the <strong> element.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/b
     */
    b: BAttributes,
    /**
     * The <base> HTML element specifies the base URL to use for all _relative_ URLs in a document. There can be only one <base> element in a document.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/base
     */
    base: BaseAttributes,
    /**
     * The <bdi> HTML element tells the browser's bidirectional algorithm to treat the text it contains in isolation from its surrounding text. It's particularly useful when a website dynamically inserts some text and doesn't know the directionality of the text being inserted.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/bdi
     */
    bdi: BdiAttributes,
    /**
     * The <bdo> HTML element overrides the current directionality of text, so that the text within is rendered in a different direction.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/bdo
     */
    bdo: BdoAttributes,
    /**
     * The <blockquote> HTML element indicates that the enclosed text is an extended quotation. Usually, this is rendered visually by indentation (see Notes for how to change it). A URL for the source of the quotation may be given using the cite attribute, while a text representation of the source can be given using the <cite> element.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/blockquote
     */
    blockquote: BlockquoteAttributes,
    /**
     * The <body> HTML element represents the content of an HTML document. There can be only one <body> element in a document.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/body
     */
    body: BodyAttributes,
    /**
     * The <br> HTML element produces a line break in text (carriage-return). It is useful for writing a poem or an address, where the division of lines is significant.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/br
     */
    br: BrAttributes,
    /**
     * The <button> HTML element is an interactive element activated by a user with a mouse, keyboard, finger, voice command, or other assistive technology. Once activated, it then performs an action, such as submitting a form or opening a dialog.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/button
     */
    button: ButtonAttributes,
    /**
     * Use the HTML <canvas> element with either the canvas scripting API or the WebGL API to draw graphics and animations.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/canvas
     */
    canvas: CanvasAttributes,
    /**
     * The <caption> HTML element specifies the caption (or title) of a table, providing the table an accessible name or accessible description.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/caption
     */
    caption: CaptionAttributes,
    /**
     * The <cite> HTML element is used to mark up the title of a creative work. The reference may be in an abbreviated form according to context-appropriate conventions related to citation metadata.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/cite
     */
    cite: CiteAttributes,
    /**
     * The <code> HTML element displays its contents styled in a fashion intended to indicate that the text is a short fragment of computer code. By default, the content text is displayed using the user agent's default monospace font.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/code
     */
    code: CodeAttributes,
    /**
     * The <col> HTML element defines one or more columns in a column group represented by its parent <colgroup> element. The <col> element is only valid as a child of a <colgroup> element that has no span attribute defined.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/col
     */
    col: ColAttributes,
    /**
     * The <colgroup> HTML element defines a group of columns within a table.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/colgroup
     */
    colgroup: ColgroupAttributes,
    /**
     * The <data> HTML element links a given piece of content with a machine-readable translation. If the content is time- or date-related, the <time> element must be used.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/data
     */
    data: DataAttributes,
    /**
     * The <datalist> HTML element contains a set of <option> elements that represent the permissible or recommended options available to choose from within other controls.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/datalist
     */
    datalist: DatalistAttributes,
    /**
     * The <dd> HTML element provides the description, definition, or value for the preceding term (<dt>) in a description list (<dl>).
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dd
     */
    dd: DdAttributes,
    /**
     * The <del> HTML element represents a range of text that has been deleted from a document. This can be used when rendering "track changes" or source code diff information, for example. The <ins> element can be used for the opposite purpose: to indicate text that has been added to the document.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/del
     */
    del: DelAttributes,
    /**
     * The <details> HTML element creates a disclosure widget in which information is visible only when the widget is toggled into an open state. A summary or label must be provided using the <summary> element.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/details
     */
    details: DetailsAttributes,
    /**
     * The <dfn> HTML element indicates a term to be defined. The <dfn> element should be used in a complete definition statement, where the full definition of the term can be one of the following:
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dfn
     */
    dfn: DfnAttributes,
    /**
     * The <dialog> HTML element represents a modal or non-modal dialog box or other interactive component, such as a dismissible alert, inspector, or subwindow.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog
     */
    dialog: DialogAttributes,
    /**
     * The <div> HTML element is the generic container for flow content. It has no effect on the content or layout until styled in some way using CSS (e.g., styling is directly applied to it, or some kind of layout model like Flexbox is applied to its parent element).
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/div
     */
    div: DivAttributes,
    /**
     * The <dl> HTML element represents a description list. The element encloses a list of groups of terms (specified using the <dt> element) and descriptions (provided by <dd> elements). Common uses for this element are to implement a glossary or to display metadata (a list of key-value pairs).
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dl
     */
    dl: DlAttributes,
    /**
     * The <dt> HTML element specifies a term in a description or definition list, and as such must be used inside a <dl> element. It is usually followed by a <dd> element; however, multiple <dt> elements in a row indicate several terms that are all defined by the immediate next <dd> element.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dt
     */
    dt: DtAttributes,
    /**
     * The <em> HTML element marks text that has stress emphasis. The <em> element can be nested, with each level of nesting indicating a greater degree of emphasis.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/em
     */
    em: EmAttributes,
    /**
     * The <embed> HTML element embeds external content at the specified point in the document. This content is provided by an external application or other source of interactive content such as a browser plug-in.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/embed
     */
    embed: EmbedAttributes,
    /**
     * The <fencedframe> HTML element represents a nested browsing context, embedding another HTML page into the current one. <fencedframe>s are very similar to <iframe> elements in form and function, except that:
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/fencedframe
     */
    fencedframe: FencedframeAttributes,
    /**
     * The <fieldset> HTML element is used to group several controls as well as labels (<label>) within a web form.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/fieldset
     */
    fieldset: FieldsetAttributes,
    /**
     * The <figcaption> HTML element represents a caption or legend describing the rest of the contents of its parent <figure> element, providing the <figure> an accessible name.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/figcaption
     */
    figcaption: FigcaptionAttributes,
    /**
     * The <figure> HTML element represents self-contained content, potentially with an optional caption, which is specified using the <figcaption> element. The figure, its caption, and its contents are referenced as a single unit.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/figure
     */
    figure: FigureAttributes,
    /**
     * The <footer> HTML element represents a footer for its nearest ancestor sectioning content or sectioning root element. A <footer> typically contains information about the author of the section, copyright data or links to related documents.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/footer
     */
    footer: FooterAttributes,
    /**
     * The <form> HTML element represents a document section containing interactive controls for submitting information.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form
     */
    form: FormAttributes,
    /**
     * The <h1> HTML element.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/h1
     */
    h1: H1Attributes,
    /**
     * The <h2> HTML element.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/h2
     */
    h2: H2Attributes,
    /**
     * The <h3> HTML element.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/h3
     */
    h3: H3Attributes,
    /**
     * The <h4> HTML element.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/h4
     */
    h4: H4Attributes,
    /**
     * The <h5> HTML element.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/h5
     */
    h5: H5Attributes,
    /**
     * The <h6> HTML element.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/h6
     */
    h6: H6Attributes,
    /**
     * The <head> HTML element contains machine-readable information (metadata) about the document, like its title, scripts, and style sheets. There can be only one <head> element in an HTML document.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/head
     */
    head: HeadAttributes,
    /**
     * The <header> HTML element represents introductory content, typically a group of introductory or navigational aids. It may contain some heading elements but also a logo, a search form, an author name, and other elements.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/header
     */
    header: HeaderAttributes,
    /**
     * The <hgroup> HTML element represents a heading and related content. It groups a single <h1>–<h6> element with one or more <p>.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/hgroup
     */
    hgroup: HgroupAttributes,
    /**
     * The <hr> HTML element represents a thematic break between paragraph-level elements: for example, a change of scene in a story, or a shift of topic within a section.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/hr
     */
    hr: HrAttributes,
    /**
     * The <html> HTML element represents the root (top-level element) of an HTML document, so it is also referred to as the _root element_. All other elements must be descendants of this element. There can be only one <html> element in a document.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/html
     */
    html: HtmlAttributes,
    /**
     * The <i> HTML element represents a range of text that is set off from the normal text for some reason, such as idiomatic text, technical terms, taxonomical designations, among others. Historically, these have been presented using italicized type, which is the original source of the <i> naming of this element.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/i
     */
    i: IAttributes,
    /**
     * The <iframe> HTML element represents a nested browsing context, embedding another HTML page into the current one.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe
     */
    iframe: IframeAttributes,
    /**
     * The <img> HTML element embeds an image into the document.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img
     */
    img: ImgAttributes,
    /**
     * The <input> HTML element is used to create interactive controls for web-based forms in order to accept data from the user; a wide variety of types of input data and control widgets are available, depending on the device and user agent. The <input> element is one of the most powerful and complex in all of HTML due to the sheer number of combinations of input types and attributes.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input
     */
    input: InputAttributes,
    /**
     * The <ins> HTML element represents a range of text that has been added to a document. You can use the <del> element to similarly represent a range of text that has been deleted from the document.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/ins
     */
    ins: InsAttributes,
    /**
     * The <kbd> HTML element represents a span of inline text denoting textual user input from a keyboard, voice input, or any other text entry device. By convention, the user agent defaults to rendering the contents of a <kbd> element using its default monospace font, although this is not mandated by the HTML standard.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/kbd
     */
    kbd: KbdAttributes,
    /**
     * The <label> HTML element represents a caption for an item in a user interface.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/label
     */
    label: LabelAttributes,
    /**
     * The <legend> HTML element represents a caption for the content of its parent <fieldset>.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/legend
     */
    legend: LegendAttributes,
    /**
     * The <li> HTML element is used to represent an item in a list. It must be contained in a parent element: an ordered list (<ol>), an unordered list (<ul>), or a menu (<menu>). In menus and unordered lists, list items are usually displayed using bullet points. In ordered lists, they are usually displayed with an ascending counter on the left, such as a number or letter.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/li
     */
    li: LiAttributes,
    /**
     * The <link> HTML element specifies relationships between the current document and an external resource. This element is most commonly used to link to stylesheets, but is also used to establish site icons (both "favicon" style icons and icons for the home screen and apps on mobile devices) among other things.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/link
     */
    link: LinkAttributes,
    /**
     * The <main> HTML element represents the dominant content of the <body> of a document. The main content area consists of content that is directly related to or expands upon the central topic of a document, or the central functionality of an application.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/main
     */
    main: MainAttributes,
    /**
     * The <map> HTML element is used with <area> elements to define an image map (a clickable link area).
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/map
     */
    map: MapAttributes,
    /**
     * The <mark> HTML element represents text which is marked or highlighted for reference or notation purposes due to the marked passage's relevance in the enclosing context.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/mark
     */
    mark: MarkAttributes,
    /**
     * The <menu> HTML element is described in the HTML specification as a semantic alternative to <ul>, but treated by browsers (and exposed through the accessibility tree) as no different than <ul>. It represents an unordered list of items (which are represented by <li> elements).
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/menu
     */
    menu: MenuAttributes,
    /**
     * The <meta> HTML element represents metadata that cannot be represented by other meta-related elements, such as <base>, <link>, <script>, <style>, or <title>.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/meta
     */
    meta: MetaAttributes,
    /**
     * The <meter> HTML element represents either a scalar value within a known range or a fractional value.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/meter
     */
    meter: MeterAttributes,
    /**
     * The <nav> HTML element represents a section of a page whose purpose is to provide navigation links, either within the current document or to other documents. Common examples of navigation sections are menus, tables of contents, and indexes.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/nav
     */
    nav: NavAttributes,
    /**
     * The <noscript> HTML element defines a section of HTML to be inserted if a script type on the page is unsupported or if scripting is currently turned off in the browser.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/noscript
     */
    noscript: NoscriptAttributes,
    /**
     * The <object> HTML element represents an external resource, which can be treated as an image, a nested browsing context, or a resource to be handled by a plugin.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/object
     */
    object: ObjectAttributes,
    /**
     * The <ol> HTML element represents an ordered list of items — typically rendered as a numbered list.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/ol
     */
    ol: OlAttributes,
    /**
     * The <optgroup> HTML element creates a grouping of options within a <select> element.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/optgroup
     */
    optgroup: OptgroupAttributes,
    /**
     * The <option> HTML element is used to define an item contained in a <select>, an <optgroup>, or a <datalist> element. As such, <option> can represent menu items in popups and other lists of items in an HTML document.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/option
     */
    option: OptionAttributes,
    /**
     * The <output> HTML element is a container element into which a site or app can inject the results of a calculation or the outcome of a user action.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/output
     */
    output: OutputAttributes,
    /**
     * The <p> HTML element represents a paragraph. Paragraphs are usually represented in visual media as blocks of text separated from adjacent blocks by blank lines and/or first-line indentation, but HTML paragraphs can be any structural grouping of related content, such as images or form fields.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/p
     */
    p: PAttributes,
    /**
     * The <picture> HTML element contains zero or more <source> elements and one <img> element to offer alternative versions of an image for different display/device scenarios.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/picture
     */
    picture: PictureAttributes,
    /**
     * The <pre> HTML element represents preformatted text which is to be presented exactly as written in the HTML file. The text is typically rendered using a non-proportional, or monospaced font.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/pre
     */
    pre: PreAttributes,
    /**
     * The <progress> HTML element displays an indicator showing the completion progress of a task, typically displayed as a progress bar.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/progress
     */
    progress: ProgressAttributes,
    /**
     * The <q> HTML element indicates that the enclosed text is a short inline quotation. Most modern browsers implement this by surrounding the text in quotation marks. This element is intended for short quotations that don't require paragraph breaks; for long quotations use the <blockquote> element.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/q
     */
    q: QAttributes,
    /**
     * The <rp> HTML element is used to provide fall-back parentheses for browsers that do not support display of ruby annotations using the <ruby> element. One <rp> element should enclose each of the opening and closing parentheses that wrap the <rt> element that contains the annotation's text.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/rp
     */
    rp: RpAttributes,
    /**
     * The <rt> HTML element specifies the ruby text component of a ruby annotation, which is used to provide pronunciation, translation, or transliteration information for East Asian typography. The <rt> element must always be contained within a <ruby> element.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/rt
     */
    rt: RtAttributes,
    /**
     * The <ruby> HTML element represents small annotations that are rendered above, below, or next to base text, usually used for showing the pronunciation of East Asian characters. It can also be used for annotating other kinds of text, but this usage is less common.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/ruby
     */
    ruby: RubyAttributes,
    /**
     * The <s> HTML element renders text with a strikethrough, or a line through it. Use the <s> element to represent things that are no longer relevant or no longer accurate. However, <s> is not appropriate when indicating document edits; for that, use the <del> and <ins> elements, as appropriate.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/s
     */
    s: SAttributes,
    /**
     * The <samp> HTML element is used to enclose inline text which represents sample (or quoted) output from a computer program. Its contents are typically rendered using the browser's default monospaced font (such as Courier>) or Lucida Console).
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/samp
     */
    samp: SampAttributes,
    /**
     * The <script> HTML element is used to embed executable code or data; this is typically used to embed or refer to JavaScript code. The <script> element can also be used with other languages, such as WebGL's GLSL shader programming language and JSON.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script
     */
    script: ScriptAttributes,
    /**
     * The <search> HTML element is a container representing the parts of the document or application with form controls or other content related to performing a search or filtering operation. The <search> element semantically identifies the purpose of the element's contents as having search or filtering capabilities. The search or filtering functionality can be for the website or application, the current web page or document, or the entire Internet or subsection thereof.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/search
     */
    search: SearchAttributes,
    /**
     * The <section> HTML element represents a generic standalone section of a document, which doesn't have a more specific semantic element to represent it. Sections should always have a heading, with very few exceptions.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/section
     */
    section: SectionAttributes,
    /**
     * The <select> HTML element represents a control that provides a menu of options.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/select
     */
    select: SelectAttributes,
    /**
     * The <selectedcontent> HTML is used inside a <select> element to display the contents of its currently selected <option> within its first child <button>. This enables you to style all parts of a <select> element, referred to as "customizable selects".
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/selectedcontent
     */
    selectedcontent: SelectedcontentAttributes,
    /**
     * The <slot> HTML element—part of the Web Components technology suite—is a placeholder inside a web component that you can fill with your own markup, which lets you create separate DOM trees and present them together.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/slot
     */
    slot: SlotAttributes,
    /**
     * The <small> HTML element represents side-comments and small print, like copyright and legal text, independent of its styled presentation. By default, it renders text within it one font-size smaller, such as from small to x-small.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/small
     */
    small: SmallAttributes,
    /**
     * The <source> HTML element specifies one or more media resources for the <picture>, <audio>, and <video> elements. It is a void element, which means that it has no content and does not require a closing tag. This element is commonly used to offer the same media content in multiple file formats in order to provide compatibility with a broad range of browsers given their differing support for image file formats and media file formats.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/source
     */
    source: SourceAttributes,
    /**
     * The <span> HTML element is a generic inline container for phrasing content, which does not inherently represent anything. It can be used to group elements for styling purposes (using the class or id attributes), or because they share attribute values, such as lang. It should be used only when no other semantic element is appropriate. <span> is very much like a <div> element, but <div> is a block-level element whereas a <span> is an inline-level element.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/span
     */
    span: SpanAttributes,
    /**
     * The <strong> HTML element indicates that its contents have strong importance, seriousness, or urgency. Browsers typically render the contents in bold type.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/strong
     */
    strong: StrongAttributes,
    /**
     * The <style> HTML element contains style information for a document, or part of a document. It contains CSS, which is applied to the contents of the document containing the <style> element.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/style
     */
    style: StyleAttributes,
    /**
     * The <sub> HTML element specifies inline text which should be displayed as subscript for solely typographical reasons. Subscripts are typically rendered with a lowered baseline using smaller text.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/sub
     */
    sub: SubAttributes,
    /**
     * The <summary> HTML element specifies a summary, caption, or legend for a <details> element's disclosure box. Clicking the <summary> element toggles the state of the parent <details> element open and closed.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/summary
     */
    summary: SummaryAttributes,
    /**
     * The <sup> HTML element specifies inline text which is to be displayed as superscript for solely typographical reasons. Superscripts are usually rendered with a raised baseline using smaller text.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/sup
     */
    sup: SupAttributes,
    /**
     * The <table> HTML element represents tabular data—that is, information presented in a two-dimensional table comprised of rows and columns of cells containing data.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/table
     */
    table: TableAttributes,
    /**
     * The <tbody> HTML element encapsulates a set of table rows (<tr> elements), indicating that they comprise the body of a table's (main) data.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/tbody
     */
    tbody: TbodyAttributes,
    /**
     * The <td> HTML element defines a cell of a table that contains data and may be used as a child of the <tr> element.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/td
     */
    td: TdAttributes,
    /**
     * The <template> HTML element serves as a mechanism for holding HTML fragments, which can either be used later via JavaScript or generated immediately into shadow DOM.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/template
     */
    template: TemplateAttributes,
    /**
     * The <textarea> HTML element represents a multi-line plain-text editing control, useful when you want to allow users to enter a sizeable amount of free-form text, for example a comment on a review or feedback form.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/textarea
     */
    textarea: TextareaAttributes,
    /**
     * The <tfoot> HTML element encapsulates a set of table rows (<tr> elements), indicating that they comprise the foot of a table with information about the table's columns. This is usually a summary of the columns, e.g., a sum of the given numbers in a column.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/tfoot
     */
    tfoot: TfootAttributes,
    /**
     * The <th> HTML element defines a cell as the header of a group of table cells and may be used as a child of the <tr> element. The exact nature of this group is defined by the scope and headers attributes.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/th
     */
    th: ThAttributes,
    /**
     * The <thead> HTML element encapsulates a set of table rows (<tr> elements), indicating that they comprise the head of a table with information about the table's columns. This is usually in the form of column headers (<th> elements).
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/thead
     */
    thead: TheadAttributes,
    /**
     * The <time> HTML element represents a specific period in time. It may include the datetime attribute to translate dates into machine-readable format, allowing for better search engine results or custom features such as reminders.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/time
     */
    time: TimeAttributes,
    /**
     * The <title> HTML element defines the document's title that is shown in a browser's title bar or a page's tab. It only contains text; HTML tags within the element, if any, are also treated as plain text.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/title
     */
    title: TitleAttributes,
    /**
     * The <tr> HTML element defines a row of cells in a table. The row's cells can then be established using a mix of <td> (data cell) and <th> (header cell) elements.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/tr
     */
    tr: TrAttributes,
    /**
     * The <track> HTML element is used as a child of the media elements, <audio> and <video>. Each track element lets you specify a timed text track (or time-based data) that can be displayed in parallel with the media element, for example to overlay subtitles or closed captions on top of a video or alongside audio tracks.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/track
     */
    track: TrackAttributes,
    /**
     * The <u> HTML element represents a span of inline text which should be rendered in a way that indicates that it has a non-textual annotation. This is rendered by default as a single solid underline, but may be altered using CSS.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/u
     */
    u: UAttributes,
    /**
     * The <ul> HTML element represents an unordered list of items, typically rendered as a bulleted list.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/ul
     */
    ul: UlAttributes,
    /**
     * The <var> HTML element represents the name of a variable in a mathematical expression or a programming context. It's typically presented using an italicized version of the current typeface, although that behavior is browser-dependent.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/var
     */
    var: VarAttributes,
    /**
     * The <video> HTML element embeds a media player which supports video playback into the document. You can use <video> for audio content as well, but the <audio> element may provide a more appropriate user experience.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video
     */
    video: VideoAttributes,
    /**
     * The <wbr> HTML element represents a word break opportunity—a position within text where the browser may optionally break a line, though its line-breaking rules would not otherwise create a break at that location.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/wbr
     */
    wbr: WbrAttributes,
}
