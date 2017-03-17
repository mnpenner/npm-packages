const XRegExp = require('xregexp');
const util = require('./util');

let nativeFuncs = new Map();
const isRaw = Symbol('isRaw');

function jsSerialize(obj) {
    // TODO: Object.isFrozen check
    // TODO: compression option -- create functions for all the different types
    if(util.isArray(obj)) {
        if(obj.length === 0) {
            return '[]';
        }
        let sb = [];
        let hasProp = false;
        for(let i=0; i<obj.length; ++i) {
            if(obj.hasOwnProperty(i)) {
                hasProp = true;
                sb.push(jsSerialize(obj[i]));
            } else {
                sb.push('');
            }
        }
        if(!hasProp) {
            return `new Array(${obj.length})`;
        }
        if(!obj.hasOwnProperty(obj.length - 1)) {
            sb.push('');
        }
        return '[' +  sb.join(',') + ']';
    } else if(obj instanceof Set) {
        if(obj.size) {
            return 'new Set([' + Array.from(obj).map(jsSerialize).join(',') + '])';
        }
        return 'new Set';
    } else if(obj instanceof Map) {
        throw new Error('Map serialization is not yet implemented');
    } else if(util.isSymbol(obj)) {
        return serializeSymbol(obj);
    } else if(util.isNativeFunction(obj)) {
        let path = nativeFuncs.get(obj);
        
        if(path !== undefined) {
            return path;
        }
        
        path = util.findFunction(global, obj);
        
        if(path === null) {
            throw new Error(`Could not determine fully-qualified name of native function '${obj.name}'`);
        }
        
        path = path.join('.');
        nativeFuncs.set(obj, path);
        return path;
    } else if(util.isFunction(obj)) {
        return obj.toString();
    } else if(util.isRegExp(obj)) {
        // return `/${obj.source}/${obj.flags}`;
        return obj.toString();
    } else if(util.isString(obj) || util.isNumber(obj)) {
        return JSON.stringify(obj);
    } else if(obj === undefined) {
        return 'undefined';
    } else if(obj === null) {
        return 'null';
    } else if(util.isObject(obj)) {
        // if(util.isFunction(obj.toScript)) {
        //     return obj.toScript();
        // }
        if(obj[isRaw]) {
            return obj.value;
        }
        if(util.isFunction(obj.toJSON)) {
            return jsSerialize(obj.toJSON());
        }
        let tmp = [];
        for(let key of Reflect.ownKeys(obj)) {
            tmp.push(serializePropertyName(key)+':'+jsSerialize(obj[key]));
        }
        return '{' + tmp.join(',') + '}';
    } else {
        throw new Error('Could not serialize unknown type');
    }
}

/**
 * @param {string} jsCode
 */
jsSerialize.raw = function raw(jsCode) {
    return Object.create({
        [isRaw]: true,
        value: jsCode,
    });
};

function serializeSymbol(sym) {
    let key = Symbol.keyFor(sym);
    if(key === undefined) {
        let m = sym.toString().match(/^Symbol\((.+)\)$/);
        if(m) {
            return `Symbol(${jsSerialize(m[1])})`;
        }
        return `Symbol()`; // not sure if this is worthwhile or not
    } else {
        return `Symbol.for(${jsSerialize(key)})`;
    }
}

const keywords = new Set(['do','if','in','for','let','new','try','var','case','else','enum','eval','false','null','this','true','void','with','break','catch','class','const','super','throw','while','yield','delete','export','import','public','return','static','switch','typeof','default','extends','finally','package','private','continue','debugger','function','arguments','interface','protected','implements','instanceof']);

const propName = XRegExp('^[$_\\p{Lu}\\p{Ll}\\p{Lt}\\p{Lm}\\p{Lo}\\p{Ll}][$_\\p{Lu}\\p{Ll}\\p{Lt}\\p{Lm}\\p{Lo}\\p{Ll}\\u200C\\u200D\\p{Mn}\\p{Mc}\\p{Nd}\\p{Pc}]*$');

function serializePropertyName(name) {
    if(util.isSymbol(name)) {
        return '['+serializeSymbol(name)+']';
    }
    if(util.isString(name)) {
        if(/*!keywords.has(name) &&*/ propName.test(name)) {
            return name;
        }
        return jsSerialize(name);
    }

    throw new Error(`Cannot make property name`);
}

module.exports = jsSerialize;