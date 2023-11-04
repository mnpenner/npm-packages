import {JsxElement,isJsx} from './jsx-nodes'
import * as util from '@mnpenner/is-type'
import * as esc from './escape'
import {AnyFn, HtmlSafe, JsxChildren, JsxRenderable} from './types'
import {isIterable} from '@mnpenner/is-type'
import {fullWide, getStringTag, mapIter} from './util'


function isHtmlSafe(x: any): x is HtmlSafe {
    return util.isPlainObject(x) && util.isString(x.__html)
}

export function render(el: JsxRenderable): string {
    if(el === null || el === undefined || el === false) {
        return '';
    }

    if(isJsx(el)) {
        return el.toString();
    }

    if(isHtmlSafe(el)) {
        return el.__html;
    }

    if(util.isString(el)) {
        return esc.htmlContent(el)
            // .replace(/ {2}/g, ' &nbsp;')  // TODO: decide if we should really do these replacements
            // .replace(/\r?\n|\r/g, '<br>');
    }

    if(util.isNumber(el)) {
        return fullWide(el);
    }

    if(Array.isArray(el)) {
        return el.map(x => render(x)).join('');
    }

    if(util.isFunction(el)) {
        return render((el as AnyFn)());
    }

    if(isIterable(el)) {
        return mapIter(el, x => render(x)).join('')
    }

    // console.info(Object.prototype.toString.call(el),el);
    // console.error('UNHANDLED ELEMENT:',el)
    throw new Error(`Unsupported type: ${getStringTag(el)}`);
}
