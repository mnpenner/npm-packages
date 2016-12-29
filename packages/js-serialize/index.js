const XRegExp = require('xregexp');
const util = require('./util');

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects
const builtIns = [
    'Array',
    'ArrayBuffer',
    'AsyncFunction',
    'Atomics',
    'Boolean',
    'DataView',
    'Date',
    'Error',
    'EvalError',
    'Float32Array',
    'Float64Array',
    'Function',
    'Generator',
    'GeneratorFunction',
    'Infinity',
    'Int16Array',
    'Int32Array',
    'Int8Array',
    'InternalError',
    'Intl',
    'Intl.Collator',
    'Intl.DateTimeFormat',
    'Intl.NumberFormat',
    'Iterator',
    'JSON',
    'Map',
    'Math',
    'NaN',
    'Number',
    'Object',
    'ParallelArray',
    'Promise',
    'Proxy',
    'RangeError',
    'ReferenceError',
    'Reflect',
    'RegExp',
    'SIMD',
    'SIMD.Bool16x8',
    'SIMD.Bool32x4',
    'SIMD.Bool64x2',
    'SIMD.Bool8x16',
    'SIMD.Float32x4',
    'SIMD.Float64x2',
    'SIMD.Int16x8',
    'SIMD.Int32x4',
    'SIMD.Int8x16',
    'SIMD.Uint16x8',
    'SIMD.Uint32x4',
    'SIMD.Uint8x16',
    'Set',
    'SharedArrayBuffer',
    'StopIteration',
    'String',
    'Symbol',
    'SyntaxError',
    'TypeError',
    'TypedArray',
    'URIError',
    'Uint16Array',
    'Uint32Array',
    'Uint8Array',
    'Uint8ClampedArray',
    'WeakMap',
    'WeakSet',
].map(lib => [lib,util.dotGet(global, lib)]).filter(x => x[1]);

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
    } else if(isNativeFunction(obj)) {
        if(!obj.name) {
            throw new Error('Could not serialize unnamed native function');
        }
        if(global[obj.name] === obj) {
            return obj.name;
        }
        for(let [libName,lib] of builtIns) {
            if(lib[obj.name] === obj) {
                return `${libName}.${obj.name}`;
            }
        }
        throw new Error(`Could not determine fully-qualified name of native function '${obj.name}'`);
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
        throw new Error('Could not serialize unknown type');
    }
}

// lodash doesn't support core-js
function isNativeFunction(obj) {
    return typeof obj === 'function' && obj.toString().endsWith('{ [native code] }');
}

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