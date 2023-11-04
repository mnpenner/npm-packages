import * as esc from './escape'
import {render} from './index'
import {Attributes, AttrObj, JsxChildren, JsxRenderable, CommonProps} from './types'
import {isIterable} from '@mnpenner/is-type'
import {isEmpty, mapIter} from './util'
import {attrs, htmlComment, htmlContent} from './escape'

// https://www.w3.org/TR/html-markup/syntax.html#syntax-elements
const voidElements = new Set(['area', 'base', 'br', 'col', 'command', 'embed', 'hr', 'img', 'input', 'keygen', 'link', 'meta', 'param', 'source', 'track', 'wbr'])

// TODO: handle <!DOCTYPE html>

export class JsxNode {
    // public static isJsxhtmlElement = true
}

export function isJsx(x: any): x is JsxNode {
    return x instanceof JsxNode
}

export class JsxElement extends JsxNode {
    constructor(private readonly tag: string, private readonly props: CommonProps) {
        super()
        if(!isEmpty(props.children) && voidElements.has(tag)) {
            throw new Error(`'${tag}' is a void element, it cannot have any children`)
        }
    }

    get [Symbol.toStringTag]() {
        return 'JsxElement'
    }

    toString(): string {
        let tag = esc.tagName(this.tag)
        const {children, ...props} = this.props
        let attrs = esc.attrs(props)
        if(voidElements.has(this.tag)) {
            return `<${tag}${attrs}>`
        }
        if(isEmpty(children)) {
            return `<${tag}${attrs}></${tag}>`
        }
        return `<${tag}${attrs}>${render(children)}</${tag}>`
    }
}

// TODO: Script tag has funny parsing rules.... no?

export class JsxRawHtml extends JsxNode {

    get [Symbol.toStringTag]() {
        return 'JsxRawHtml'
    }

    constructor(private readonly html: string) {
        super()
    }

    toString(): string {
        return this.html
    }
}

export type DocTypeProps = {
    html?: true
    // TODO: add DTD support
}

export class JsxDocType extends JsxNode {
    get [Symbol.toStringTag]() {
        return 'JsxDocType'
    }

    constructor(private readonly attrs: DocTypeProps) {
        super()
    }

    toString(): string {
        return `<!DOCTYPE${attrs(this.attrs)}>`
    }
}

export class JsxComment extends JsxNode {
    get [Symbol.toStringTag]() {
        return 'JsxComment'
    }

    constructor(private readonly text: string) {
        super()
    }

    toString(): string {
        return `<!-- ${htmlComment(this.text)} -->`
    }
}

export class JsxEmpty extends JsxNode {
    get [Symbol.toStringTag]() {
        return 'JsxEmpty'
    }

    toString(): string {
        return ''
    }
}

export class JsxFragment extends JsxNode {
    get [Symbol.toStringTag]() {
        return 'JsxFragment'
    }

    constructor(private readonly children: JsxRenderable | undefined) {
        super()
    }

    toString(): string {
        return render(this.children)
    }
}
