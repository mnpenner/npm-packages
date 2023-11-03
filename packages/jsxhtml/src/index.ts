import JsxhtmlElement from './JsxhtmlElement'
import * as util from '@mnpenner/is-type'
import * as esc from './escape'
import {AnyFn, HtmlSafe, JsxhtmlNode} from './types'


function isHtmlSafe(x: any): x is HtmlSafe {
    return util.isPlainObject(x) && util.isString(x.__html)
}

export function render(el: JsxhtmlNode): string {
    if(el === null || el === undefined || el === false) {
        return '';
    }

    if(el instanceof JsxhtmlElement) {
        return el.toString();
    }

    if(isHtmlSafe(el)) {
        return el.__html;
    }

    if(util.isString(el)) {
        return esc.htmlContent(el)
            .replace(/ {2}/g, ' &nbsp;')
            .replace(/\r?\n|\r/g, '<br>');
    }

    if(util.isNumber(el)) {
        return String(el);
    }

    if(Array.isArray(el)) {
        return el.map(x => render(x)).join('');
    }

    if(util.isFunction(el) || util.isGeneratorFunction(el)) {
        return render((el as AnyFn)());
    }

    if(el[Symbol.iterator] !== undefined) {
        return Array.from(el).map(x => render(x)).join('');
    }

    console.info(Object.prototype.toString.call(el),el);
    throw new Error(`Unsupported type`);
}
