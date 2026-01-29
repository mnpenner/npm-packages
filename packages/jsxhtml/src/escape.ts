import entityMap from './entityMap'
import {classCat} from './classnames'
import * as util from '@mpen/is-type'
import styleObjectToString from './styleObjectToString'
import type {AttrArr, Attributes, AttributeValue, Stringable} from './jsx-types'
import {isFunction} from '@mpen/is-type'

function entity(ch: string) {
    return Object.prototype.hasOwnProperty.call(entityMap, ch) ? `&${entityMap[ch]};` : `&#x${ch.codePointAt(0)!.toString(16)};`;
}

// https://www.w3.org/TR/html-markup/syntax.html#tag-name
export function tagName(string: Stringable) {
    return String(string).replace(/[^0-9a-zA-Z]/g, entity);
}

// https://www.w3.org/TR/html-markup/syntax.html#syntax-attributes
export function attrName(string: Stringable) {
    return String(string).replace(/[\x00\x20\x09\x0A\x0C\x0D"'>/=]/g, entity);
}

// https://www.w3.org/TR/html-markup/syntax.html#attr-value-double-quoted
export function attrValue(value: Stringable) {
    // TODO: if value is an anonymous function, should we extract it, give it a name and invoke it like <script>function $a(ev){...}</script><button onclick="return $a(event);">
    // if(isNumber(string)) {
    //     return fullWide(string)
    // }
    if(isFunction(value)) {
        // "onclick" attributes are invoked immediately
        // window.event: https://developer.mozilla.org/en-US/docs/Web/API/Window/event
        value = `(${value}).call(this,event)`
    }
    return `"${String(value).replace(/"/gu, entity)}"`;
}

export function attrKvPair(rawAttr: string, rawVal: AttributeValue) {
    let escAttr = attrName(rawAttr);

    if(/^data-/.test(rawAttr) && !util.isString(rawVal)) {
        // TODO: should we make a special exception for data- attributes? I guess we want to preserve null/true/false...
        rawVal = JSON.stringify(rawVal);
    }

    if(rawVal === true) {
        return escAttr;
    }

    if(rawVal === false || rawVal == null) {
        return null;
    }

    if(rawAttr === 'class' && !util.isString(rawVal)) {
        rawVal = classCat(rawVal as any);
    }

    if(rawAttr === 'style' && util.isPlainObject(rawVal)) {
        rawVal = styleObjectToString(rawVal);
    }

    return `${escAttr}=${attrValue(rawVal)}`;
}

export function attrs(attributes: Attributes) {
    if(attributes == null) return ''
    if(util.isPlainObject(attributes)) {
        attributes = Object.entries(attributes);
    }
    return (attributes as AttrArr).map(([k,v]) => attrKvPair(k,v)).filter(x => x).map(x => ` ${x}`).join('');
}

// https://www.w3.org/TR/html-markup/syntax.html#text-syntax
export function htmlContent(string: Stringable) {
    return String(string).replace(/<|&(?=[0-9a-zA-Z]+;)/gu, entity);
}

export function htmlComment(string: Stringable) {
    return String(string).replace(/-->/gu, '--&gt;');
}

export function escapeScript(string: Stringable) {
    return String(string).replace(/<\/(script)/igu, '<\\/$1')
}

export function escapeStyle(string: Stringable) {
    return String(string).replace(/<\/(style)/igu, '<\\/$1')
}

/**
 * Generic HTML escape. Works for both attribute values and HTML content.
 *
 * @param {string} str Text
 * @returns {string} Escaped HTML
 */
// export function html(str) {
//     return String(str).replace(/[&"'<>]/g, entity);
// }
