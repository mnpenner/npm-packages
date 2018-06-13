import entityMap from './entityMap';
const classNames = require('classnames');
import * as util from './util';
import styleObjectToString from './styleObjectToString';

function entity(ch) {
    return util.hasProp(entityMap, ch) ? `&${entityMap[ch]};` : `&#x${ch.codePointAt().toString(16)};`;
}

// https://www.w3.org/TR/html-markup/syntax.html#tag-name
export function tagName(string) {
    return String(string).replace(/[^0-9a-zA-Z]/g, entity);
}

// https://www.w3.org/TR/html-markup/syntax.html#syntax-attributes
export function attrName(string) {
    return String(string).replace(/[\x00\x20\x09\x0A\x0C\x0D"'>/=]/g, entity);
}

// https://www.w3.org/TR/html-markup/syntax.html#attr-value-double-quoted
export function attrValue(string) {
    // TODO: if value is an anonymous function, should we extract it, give it a name and invoke it like <script>function $a(ev){...}</script><button onclick="return $a(event);">
    return `"${String(string).replace(/"/g, entity)}"`;
}

export function attr(rawAttr, rawVal) {
    let escAttr = attrName(rawAttr);

    if(/^data-/.test(rawAttr) && !util.isString(rawVal)) {
        rawVal = JSON.stringify(rawVal);
    }

    if(rawVal === true) {
        return escAttr;
    }

    if(rawVal === false || rawVal === undefined) {
        return null;
    }

    // fixme: what to do for `null`?

    if(rawAttr === 'class' && !util.isString(rawVal)) {
        rawVal = classNames(rawVal);
    }

    if(rawAttr === 'style' && util.isObject(rawVal)) {
        rawVal = styleObjectToString(rawVal);
    }

    return `${escAttr}=${attrValue(rawVal)}`;
}

export function attrs(attributes) {
    if(util.isObject(attributes)) {
        attributes = Object.entries(attributes);
    }
    return attributes.map(([k,v]) => attr(k,v)).filter(x => x).map(x => ` ${x}`).join('');
}

// https://www.w3.org/TR/html-markup/syntax.html#text-syntax
export function htmlContent(string) {
    return String(string).replace(/<|&(?=[0-9a-zA-Z]+;)/g, entity);
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
