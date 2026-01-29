/// <reference lib="dom" />

export interface EventHandlerMap {
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
