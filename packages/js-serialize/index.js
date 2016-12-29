const XRegExp = require('xregexp');
const util = require('./util');

function jsSerialize(obj) {
    if(util.isArray(obj)) {
        return '[' +  obj.map(jsSerialize).join(',') + ']';
    } else if(obj instanceof Set) {
        if(obj.size) {
            return 'new Set([' + Array.from(obj).map(jsSerialize).join(',') + '])';
        }
        return 'new Set';
    } else if(obj instanceof Map) {
        throw new Error('Map serialization is not yet implemented');
    } else if(obj instanceof Symbol) {
        return serializeSymbol(obj);
    } else if(isNativeFunction(obj)) {
        throw new Error('Cannot serialize native functions'); // ...or maybe we *can* serialize native functions? just replace it with a call to the function!
    } else if(util.isFunction(obj)) {
        return obj.toString();
    } else if(util.isRegExp(obj)) {
        // return `/${obj.source}/${obj.flags}`;
        return obj.toString();
    } else if(util.isString(obj) || util.isNumber(obj)) {
        return JSON.stringify(obj);
    } else if(util.isObject(obj)) {
        if(util.isFunction(obj.toScript)) {
            return obj.toScript();
        }
        if(util.isFunction(obj.toJSON)) {
            return jsSerialize(obj.toJSON());
        }
        let tmp = [];
        for(let key in obj) {
            //noinspection JSUnfilteredForInLoop
            tmp.push(serializePropertyName(key)+':'+jsSerialize(obj[key]));
        }
        return '{' + tmp.join(',') + '}';
    } else {
        return JSON.stringify(obj);
    }
}

// lodash doesn't support core-js
function isNativeFunction(obj) {
    return typeof obj === 'function' && obj.toString().endsWith('{ [native code] }');
}

function serializeSymbol(sym) {
    let key = Symbol.keyFor(sym);
    if(key === undefined) {
        return `Symbol()`;
    } else {
        return `Symbol.for(${JSON.stringify(key)})`;
    }
}

const keywords = new Set(['do','if','in','for','let','new','try','var','case','else','enum','eval','false','null','this','true','void','with','break','catch','class','const','super','throw','while','yield','delete','export','import','public','return','static','switch','typeof','default','extends','finally','package','private','continue','debugger','function','arguments','interface','protected','implements','instanceof']);
const propName = XRegExp('^[$_\\p{Lu}\\p{Ll}\\p{Lt}\\p{Lm}\\p{Lo}\\p{Ll}][$_\\p{Lu}\\p{Ll}\\p{Lt}\\p{Lm}\\p{Lo}\\p{Ll}\\u200C\\u200D\\p{Mn}\\p{Mc}\\p{Nd}\\p{Pc}]*$');

function serializePropertyName(name) {
    if(name instanceof Symbol) {
        return '['+serializeSymbol(sym)+']';
    }
    if(util.isString(name)) {
        if(/*!keywords.has(name) &&*/ propName.test(name)) {
            return name;
        }
        return JSON.stringify(name);
    }

    throw new Error(`Cannot make property name`);
}

module.exports = jsSerialize;