import * as esc from './escape'
import {attrs, escapeScript, escapeStyle, htmlComment} from './escape'
import {render} from './render'
import type {AnyAttributes, JsxChildren} from './jsx-types'
import {flattenChildren, isEmptyChildren, scriptChild, styleChild} from './util'
import {JsxNode} from './jsx-node'
import {JsFrag} from './template-strings'

// https://www.w3.org/TR/html-markup/syntax.html#syntax-elements
// https://www.w3.org/TR/2011/WD-html-markup-20110113/syntax.html#syntax-elements
const voidElements = new Set(['area', 'base', 'br', 'col', 'command', 'embed', 'hr', 'img', 'input', 'keygen', 'link', 'meta', 'param', 'source', 'track', 'wbr'])

// TODO: handle <!DOCTYPE html>

export class JsxElement extends JsxNode {
    constructor(private readonly tag: string, private readonly props: AnyAttributes) {
        super()
        if(!isEmptyChildren(props.children) && voidElements.has(tag)) {
            throw new Error(`'${tag}' is a void element, it cannot have any children`)
        }
    }

    get [Symbol.toStringTag]() {
        return 'JsxElement'
    }

    toString(): string {
        const normalizedTagName = String(this.tag).trim().toLowerCase()
        let tag = esc.tagName(this.tag)
        const {children, ...props} = this.props
        let attrs = esc.attrs(props)
        if(voidElements.has(this.tag)) {
            return `<${tag}${attrs}>`
        }
        if(isEmptyChildren(children)) {
            return `<${tag}${attrs}></${tag}>`
        }
        if(normalizedTagName === 'script') {
            // We can't tell string literals apart from vars :-(
            // https://www.typescriptlang.org/play/?jsx=4#code/FAYw9gdgzgLgBADzgXjgHgCYEsBuA+YNABzwAkBTAG0rDQHoTCSBvAcgurFYF97H7s+IA
            // logFull(children)
            return `<${tag}${attrs}>${children instanceof JsFrag ? children.toString() : escapeScript(flattenChildren(children,scriptChild))}</${tag}>`
        }
        if(normalizedTagName === 'style') {
            // logFull(children)
            return `<${tag}${attrs}>${escapeStyle(flattenChildren(children,styleChild))}</${tag}>`
        }
        return `<${tag}${attrs}>${flattenChildren(children,render)}</${tag}>`
    }
}

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
        return `<!--${htmlComment(this.text)}-->`
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

export const EMPTY = new JsxEmpty()

export class JsxFragment extends JsxNode {
    get [Symbol.toStringTag]() {
        return 'JsxFragment'
    }

    constructor(private readonly children: JsxChildren) {
        super()
    }

    toString(): string {
        return render(this.children)
    }
}
