import * as esc from './escape'
import {render} from './index'
import {Attributes, JsxhtmlChildren, Props} from './types'
import {isIterable} from '@mnpenner/is-type'
import {mapIter} from './util'

// https://www.w3.org/TR/html-markup/syntax.html#syntax-elements
const voidElements = new Set(['area', 'base', 'br', 'col', 'command', 'embed', 'hr', 'img', 'input', 'keygen', 'link', 'meta', 'param', 'source', 'track', 'wbr'])

// TODO: handle <!DOCTYPE html>

export default class JsxhtmlElement {
    constructor(private readonly tag: string, private readonly props: Props) {
        if(props.children != null && props.children.length > 0 && voidElements.has(tag)) {
            throw new Error(`'${tag}' is a void element, it cannot have any children`)
        }
    }

    toString(): string {
        let tag = esc.tagName(this.tag)
        const {children, ...props} = this.props
        let attrs = esc.attrs(props)
        if(voidElements.has(this.tag)) {
            return `<${tag}${attrs}>`
        }
        if(children == null || children.length === 0) {
            return `<${tag}${attrs}></${tag}>`
        }
        const content = isIterable(children) ? mapIter(children, render).join('') : render(children)
        return `<${tag}${attrs}>${content}</${tag}>`
    }
}

