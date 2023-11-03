import * as esc from './escape.js';
import {render} from './index.js';

// https://www.w3.org/TR/html-markup/syntax.html#syntax-elements
const voidElements = new Set(['area', 'base', 'br', 'col', 'command', 'embed', 'hr', 'img', 'input', 'keygen', 'link', 'meta', 'param', 'source', 'track', 'wbr']);

export default class JsxhtmlElement {
    constructor(tag, attrs, children) {
        if(children.length > 0 && voidElements.has(tag)) {
            throw new Error(`'${tag}' is a void element, it cannot have any children`);
        }
        this.tag = tag;
        this.attrs = attrs;
        this.children = children;
    }

    toString() {
        let tag = esc.tagName(this.tag);
        let attrs = esc.attrs(this.attrs);
        if(voidElements.has(this.tag)) {
            return `<${tag}${attrs}>`;
        }
        if(this.children.length === 0) {
            return `<${tag}${attrs}></${tag}>`;
        }
        let content = this.children.map(render).join('');
        return `<${tag}${attrs}>${content}</${tag}>`;
    }
}

