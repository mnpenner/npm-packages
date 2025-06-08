/// <reference lib="dom" />

// https://html.spec.whatwg.org/multipage/dom.html#global-attributes
// https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes

export type StandardGlobalAttributes = {
    /**
     * Provides a hint for generating a keyboard shortcut for the current element. This attribute consists of a
     * space-separated list of characters. The browser should use the first one that exists on the computer keyboard
     * layout.
     */
    accesskey?: string
    /**
     * Controls whether and how text input is automatically capitalized as it is entered/edited by the user. It can
     * have the following values:
     *
     * - `off` or `none`, no autocapitalization is applied (all letters default to lowercase)
     * - `on` or `sentences`, the first letter of each sentence defaults to a capital letter; all other letters default
     * to lowercase
     * - `words`, the first letter of each word defaults to a capital letter; all other letters default to lowercase
     * - `characters`, all letters should default to uppercase
     */
    autocapitalize?: string
    /**
     * Indicates that an element is to be focused on page load, or as soon as the <dialog> it is part of is displayed.
     * This attribute is a boolean, initially false.
     */
    autofocus?: string
    /**
     * A space-separated list of the classes of the element. Classes allow CSS and JavaScript to select and access
     * specific elements via the class selectors or functions like the method Document.getElementsByClassName().
     */
    class?: string
    /**
     * An enumerated attribute indicating if the element should be editable by the user. If so, the browser modifies
     * its widget to allow editing. The attribute must take one of the following values:
     *
     * - `true` or the empty string, which indicates that the element must be editable;
     * - `false`, which indicates that the element must not be editable.
     */
    contenteditable?: string
    /**
     * The id of a `<menu>` to use as the contextual menu for this element.
     *
     * @deprecated
     */
    contextmenu?: string
    /**
     * Forms a class of attributes, called custom data attributes, that allow proprietary information to be exchanged
     * between the HTML and its DOM representation that may be used by scripts. All such custom data are available via
     * the HTMLElement interface of the element the attribute is set on. The HTMLElement.dataset property gives access
     * to them.
     */
    [data: `data-${string}`]: string
    /**
     * An enumerated attribute indicating the directionality of the element's text. It can have the following values:
     *
     * - `ltr`, which means left to right and is to be used for languages that are written from the left to the right
     * (like English);
     * - `rtl`, which means right to left and is to be used for languages that are written from the right to the left
     * (like Arabic);
     * - `auto`, which lets the user agent decide. It uses a basic algorithm as it parses the characters inside the
     * element until it finds a character with a strong directionality, then it applies that directionality to the
     * whole element.
     */
    dir?: string
    /**
     * An enumerated attribute indicating whether the element can be dragged, using the Drag and Drop API. It can have
     * the following values:
     *
     * - `true`, which indicates that the element may be dragged
     * - `false`, which indicates that the element may not be dragged.
     */
    draggable?: string
    /**
     * Hints what action label (or icon) to present for the enter key on virtual keyboards.
     */
    enterkeyhint?: string
    /**
     * Used to transitively export shadow parts from a nested shadow tree into a containing light tree.
     * @experimental
     */
    exportparts?: string
    /**
     * An enumerated attribute indicating that the element is not yet, or is no longer, relevant. For example, it can
     * be used to hide elements of the page that can't be used until the login process has been completed. The browser
     * won't render such elements. This attribute must not be used to hide content that could legitimately be shown.
     */
    hidden?: boolean | 'hidden' | 'until-found'
    /**
     * Defines a unique identifier (ID) which must be unique in the whole document. Its purpose is to identify the
     * element when linking (using a fragment identifier), scripting, or styling (with CSS).
     */
    id?: string
    /**
     * A boolean value that makes the browser disregard user input events for the element. Useful when click events are
     * present.
     */
    inert?: boolean
    /**
     * Provides a hint to browsers about the type of virtual keyboard configuration to use when editing this element or
     * its contents. Used primarily on <input> elements, but is usable on any element while in contenteditable mode.
     */
    inputmode?: InputMode | string
    /**
     * Allows you to specify that a standard HTML element should behave like a registered custom built-in element (see
     * Using custom elements for more details).
     */
    is?: string
    /**
     * [Microdata](https://html.spec.whatwg.org/multipage/microdata.html#microdata)
     *
     * The unique, global identifier of an item.
     */
    itemid?: string
    /**
     * [Microdata](https://html.spec.whatwg.org/multipage/microdata.html#microdata)
     *
     * Used to add properties to an item. Every HTML element may have an itemprop attribute specified, where an
     * itemprop consists of a name and value pair.
     */
    itemprop?: string
    /**
     * [Microdata](https://html.spec.whatwg.org/multipage/microdata.html#microdata)
     *
     * Properties that are not descendants of an element with the itemscope attribute can be associated with the item
     * using an itemref. It provides a list of element ids (not itemids) with additional properties elsewhere in the
     * document.
     */
    itemref?: string
    /**
     * [Microdata](https://html.spec.whatwg.org/multipage/microdata.html#microdata)
     *
     * itemscope (usually) works along with itemtype to specify that the HTML contained in a block is about a
     * particular item. itemscope creates the Item and defines the scope of the itemtype associated with it. itemtype
     * is a valid URL of a vocabulary (such as schema.org) that describes the item and its properties context.
     */
    itemscope?: string
    /**
     * [Microdata](https://html.spec.whatwg.org/multipage/microdata.html#microdata)
     *
     * Specifies the URL of the vocabulary that will be used to define itemprops (item properties) in the data
     * structure. itemscope is used to set the scope of where in the data structure the vocabulary set by itemtype will
     * be active.
     */
    itemtype?: string
    /**
     * Helps define the language of an element: the language that non-editable elements are in, or the language that
     * editable elements should be written in by the user. The attribute contains one "language tag" (made of
     * hyphen-separated "language subtags") in the format defined in RFC 5646: Tags for Identifying Languages (also
     * known as BCP 47). xml:lang has priority over it.
     */
    lang?: string
    /**
     * A cryptographic nonce ("number used once") which can be used by Content Security Policy to determine whether or
     * not a given fetch will be allowed to proceed.
     */
    nonce?: string
    /**
     * A space-separated list of the part names of the element. Part names allows CSS to select and style specific
     * elements in a shadow tree via the ::part pseudo-element.
     */
    part?: string
    /**
     * Used to designate an element as a popover element (see Popover API). Popover elements are hidden via display:
     * none until opened via an invoking/control element (i.e. a <button> or <input type="button"> with a popovertarget
     * attribute) or a HTMLElement.showPopover() call.
     */
    popover?: string
    /**
     * An enumerated attribute defines whether the element may be checked for spelling errors. It may have the
     * following values:
     *
     * - empty string or true, which indicates that the element should be, if possible, checked for spelling errors;
     * - `false`, which indicates that the element should not be checked for spelling errors.
     */
    spellcheck?: string
    /**
     * Contains CSS styling declarations to be applied to the element. Note that it is recommended for styles to be
     * defined in a separate file or files. This attribute and the <style> element have mainly the purpose of allowing
     * for quick styling, for example for testing purposes.
     */
    style?: string
    /**
     * An integer attribute indicating if the element can take input focus (is focusable), if it should participate to
     * sequential keyboard navigation, and if so, at what position. It can take several values:
     *
     * - a negative value means that the element should be focusable, but should not be reachable via sequential
     * keyboard navigation;
     * - 0 means that the element should be focusable and reachable via sequential keyboard navigation, but its
     * relative order is defined by the platform convention;
     * - a positive value means that the element should be focusable and reachable via sequential keyboard navigation;
     * the order in which the elements are focused is the increasing value of the tabindex. If several elements share
     * the same tabindex, their relative order follows their relative positions in the document.
     */
    tabindex?: Numeric
    /**
     * Contains a text representing advisory information related to the element it belongs to. Such information can
     * typically, but not necessarily, be presented to the user as a tooltip.
     */
    title?: string
    /**
     * An enumerated attribute that is used to specify whether an element's attribute values and the values of its Text
     * node children are to be translated when the page is localized, or whether to leave them unchanged. It can have
     * the following values:
     *
     * - empty string or yes, which indicates that the element will be translated.
     * - no, which indicates that the element will not be translated.
     */
    translate?: true | 'yes' | 'no'
    /**
     * An enumerated attribute used to control the on-screen virtual keyboard behavior on devices such as tablets,
     * mobile phones, or other devices where a hardware keyboard may not be available for elements that also uses the
     * contenteditable attribute.
     *
     * - `auto` or an empty string, which automatically shows the virtual keyboard when the element is focused or
     * tapped.
     * - `manual`, which decouples focus and tap on the element from the virtual keyboard's state.
     */
    virtualkeyboardpolicy?: true | 'auto' | 'manual'
}

export type Numeric = number | `${number}`

export const enum InputMode {
    /**
     * No virtual keyboard. For when the page implements its own keyboard input control.
     */
    None = 'none',
    /**
     * Standard input keyboard for the user's current locale.
     */
    Text = 'text',
    /**
     * Fractional numeric input keyboard containing the digits and decimal separator for the user's locale (typically .
     * or ,). Devices may or may not show a minus key (-).
     */
    Decimal = 'decimal',
    /**
     * Numeric input keyboard, but only requires the digits 0–9. Devices may or may not show a minus key.
     */
    Numeric = 'numeric',
    /**
     * A telephone keypad input, including the digits 0–9, the asterisk (*), and the pound (#) key. Inputs that
     * *require* a telephone number should typically use <input type="tel"> instead.
     */
    Tel = 'tel',
    /**
     * A virtual keyboard optimized for search input. For instance, the return/submit key may be labeled "Search",
     * along with possible other optimizations. Inputs that require a search query should typically use <input
     * type="search"> instead.
     */
    Search = 'search',
    /**
     * A virtual keyboard optimized for entering email addresses. Typically includes the @character as well as other
     * optimizations. Inputs that require email addresses should typically use <input type="email"> instead.
     */
    Email = 'email',
    /**
     * A keypad optimized for entering URLs. This may have the / key more prominent, for example. Enhanced features
     * could include history access and so on. Inputs that require a URL should typically use <input type="url">
     * instead.
     */
    Url = 'url',
}

export type AriaAttributes = {
    /**
     * Roles define the semantic meaning of content, allowing screen readers and other tools to present and support
     * interaction with an object in a way that is consistent with user expectations of that type of object. roles are
     * added to HTML elements using role="role_type", where role_type is the name of a role in the ARIA specification.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles
     */
    role?: string
    [aria: `aria-${string}`]: string
}

export type XmlAttributes = {
    /**
     * @deprecated
     */
    'xml:lang': string
    /**
     * @deprecated
     */
    'xml:base': string
}

export type EventHandlerMap = {
    onauxclick: MouseEvent
    onbeforeinput: InputEvent
    onbeforematch: Event
    onbeforetoggle: Event
    onblur: FocusEvent
    oncancel: Event
    oncanplay: Event
    oncanplaythrough: Event
    onchange: Event
    onclick: MouseEvent
    onclose: Event
    oncontextlost: Event
    oncontextmenu: MouseEvent
    oncontextrestored: Event
    oncopy: ClipboardEvent
    oncuechange: Event
    oncut: ClipboardEvent
    ondblclick: MouseEvent
    ondrag: DragEvent
    ondragend: DragEvent
    ondragenter: DragEvent
    ondragleave: DragEvent
    ondragover: DragEvent
    ondragstart: DragEvent
    ondrop: DragEvent
    ondurationchange: Event
    onemptied: Event
    onended: Event
    onerror: ErrorEvent
    onfocus: FocusEvent
    onformdata: FormDataEvent
    oninput: InputEvent
    oninvalid: Event
    onkeydown: KeyboardEvent
    onkeypress: KeyboardEvent
    onkeyup: KeyboardEvent
    onload: Event
    onloadeddata: Event
    onloadedmetadata: Event
    onloadstart: ProgressEvent
    onmousedown: MouseEvent
    onmouseenter: MouseEvent
    onmouseleave: MouseEvent
    onmousemove: MouseEvent
    onmouseout: MouseEvent
    onmouseover: MouseEvent
    onmouseup: MouseEvent
    onpaste: ClipboardEvent
    onpause: Event
    onplay: Event
    onplaying: Event
    onprogress: ProgressEvent
    onratechange: Event
    onreset: Event
    onresize: UIEvent
    onscroll: Event
    onscrollend: Event
    onsecuritypolicyviolation: SecurityPolicyViolationEvent
    onseeked: Event
    onseeking: Event
    onselect: Event
    onslotchange: Event
    onstalled: Event
    onsubmit: SubmitEvent
    onsuspend: Event
    ontimeupdate: Event
    ontoggle: Event
    onvolumechange: Event
    onwaiting: Event
    onwheel: WheelEvent
}

// TODO: HTMLElement should be more specific, like HTMLButtonElement
export type GlobalEventHandlers<E=HTMLElement> = {
    [K in keyof EventHandlerMap]?: string | ((this: E, ev: EventHandlerMap[K]) => any)
}

export type AllGlobalAttributes<E=HTMLElement> = StandardGlobalAttributes&AriaAttributes&GlobalEventHandlers<E>

