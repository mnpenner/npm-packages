import * as util from '@mpen/is-type'
import * as esc from './escape'
import type {AnyFn, HtmlSafe, JsxRenderable} from './jsx-types'
import {isIterable} from '@mpen/is-type'
import {fullWide, getStringTag, isEmptyRender, mapIter} from './util'
import {isJsxNode} from './jsx-node'


export function isHtmlSafe(x: any): x is HtmlSafe {
    return util.isPlainObject(x) && util.isString(x.__html)
}

export function render(el: JsxRenderable): string {
    if(isEmptyRender(el)) {
        return ''
    }

    if(isJsxNode(el)) {
        return el.toString()
    }

    if(isHtmlSafe(el)) {
        return el.__html  // TODO: do we still need this now that we have <RawHtml> ?
    }

    if(util.isString(el)) {
        return esc.htmlContent(el)
        // .replace(/ {2}/g, ' &nbsp;')  // TODO: decide if we should really do these replacements
        // .replace(/\r?\n|\r/g, '<br>');
    }

    if(util.isNumber(el)) {
        return fullWide(el)
    }

    if(Array.isArray(el)) {
        return el.map(x => render(x)).join('')
    }

    if(util.isFunction(el)) {
        return render((el as AnyFn)())
    }

    if(isIterable(el)) {
        return mapIter(el, x => render(x)).join('')
    }

    // console.info(Object.prototype.toString.call(el),el);
    // console.error('UNHANDLED ELEMENT:',el)
    throw new Error(`Unsupported type: ${getStringTag(el)}`)
}
