import * as esc from './escape'
import {render} from './index'
import {Attributes, JsxhtmlChildren, JsxhtmlNode, Props} from './types'
import {isIterable} from '@mnpenner/is-type'
import {isEmpty, mapIter} from './util'

// https://www.w3.org/TR/html-markup/syntax.html#syntax-elements
const voidElements = new Set(['area', 'base', 'br', 'col', 'command', 'embed', 'hr', 'img', 'input', 'keygen', 'link', 'meta', 'param', 'source', 'track', 'wbr'])

// TODO: handle <!DOCTYPE html>

export function isJsx(x: any): x is JsxhtmlElement|JsxhtmlFragment {
    return x instanceof JsxhtmlElement || x instanceof JsxhtmlFragment
}

export default class JsxhtmlElement {
    constructor(private readonly tag: string, private readonly props: Props) {
        if(!isEmpty(props.children) && voidElements.has(tag)) {
            throw new Error(`'${tag}' is a void element, it cannot have any children`)
        }
    }

    get [Symbol.toStringTag]() {
        return 'JsxhtmlElement';
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

export class JsxhtmlFragment {
    constructor(private readonly children: JsxhtmlNode|undefined) {

    }

    get [Symbol.toStringTag]() {
        return 'JsxhtmlFragment';
    }

    toString(): string {
        return render(this.children)
    }
}
