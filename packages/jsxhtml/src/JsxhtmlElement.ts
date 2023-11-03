import * as esc from './escape'
import {render} from './index'
import {Attributes, JsxhtmlChildren} from './types'

// https://www.w3.org/TR/html-markup/syntax.html#syntax-elements
const voidElements = new Set(['area', 'base', 'br', 'col', 'command', 'embed', 'hr', 'img', 'input', 'keygen', 'link', 'meta', 'param', 'source', 'track', 'wbr'])

// TODO: handle <!DOCTYPE html>

export default class JsxhtmlElement {
    constructor(private readonly tag: string, private readonly attrs: Attributes, private readonly children: JsxhtmlChildren) {
        if(children.length > 0 && voidElements.has(tag)) {
            throw new Error(`'${tag}' is a void element, it cannot have any children`)
        }
    }

    toString(): string {
        let tag = esc.tagName(this.tag)
        let attrs = esc.attrs(this.attrs)
        if(voidElements.has(this.tag)) {
            return `<${tag}${attrs}>`
        }
        if(this.children.length === 0) {
            return `<${tag}${attrs}></${tag}>`
        }
        const content = this.children.map(render).join('')
        return `<${tag}${attrs}>${content}</${tag}>`
    }
}

