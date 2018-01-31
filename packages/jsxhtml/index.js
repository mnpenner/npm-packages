import JsxhtmlElement from './JsxhtmlElement';
import * as util from './util';
import * as esc from './escape';

export default function jsxhtml(tag, attrs, ...children) {
    if(util.isFunction(tag)) {
        return tag({...attrs, children});
    }

    return new JsxhtmlElement(tag, attrs || [], children);
}

export function render(el) {
    if(el === null || el === undefined || el === false) {
        return '';
    }

    if(el instanceof JsxhtmlElement) {
        return el.toString();
    }

    if(util.isObject(el) && util.isString(el.__html)) {
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
        return render(el());
    }

    if(el[Symbol.iterator] !== undefined) {
        return Array.from(el).map(x => render(x)).join('');
    }

    console.info(Object.prototype.toString.call(el),el);
    throw new Error(`Unsupported type`);
}
