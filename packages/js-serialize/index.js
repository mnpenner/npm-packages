const XRegExp = require('xregexp');
const util = require('./util');

let nativeFuncs = new Map();
const isRaw = Symbol('isRaw');

const defaults = {
    compact: false,
    safe: true,
};

function jsSerialize(obj, options) {
    
    let opt = Object.assign({
        _objects: new Set(),
        _circular: new Set(),
    }, defaults, options);
    
    let out = doSerialize(obj, opt);
    
    if(opt._circular.size) {
        let values = Array.from(opt._circular).map((o,i) => [o,`$${i}`]);
        out = doSerialize(obj, Object.assign({_lookup: new Map(values)}, defaults, options));
        // let z = values.map(v => doSerialize(v[0],Object.assign({_force: true},defaults,options))).join(',');
        let z = 111;
        out = `((${values.map(v => v[1]).join(',')})=>(${out}))(${z})`;
    }
    
    return out.split('</script').join('<\\/script');
}

function doSerialize(obj, options) {
    const R = o => doSerialize(o, options);
    
    
    if(!options._force && util.isObject(obj)) {
        if(options._lookup) { // 2nd run
            if(options._lookup.has(obj)) {
                return options._lookup.get(obj);
            }
        } else {
            if(options._objects.has(obj)) {
                // recursion -- skip for now
                options._circular.add(obj);
                return '«recursion»';
            }
            options._objects.add(obj);
        }
    }
    
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
                sb.push(R(obj[i]));
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
            return 'new Set(' + R(Array.from(obj)) + ')';
        }
        return 'new Set';
    } else if(obj instanceof Map) {
        if(obj.size) {
            return 'new Map(' + R(Array.from(obj)) + ')';
        }
        return 'new Map';
    } else if(obj instanceof Date) {
        return 'new Date(' + R(options.compact ? obj.getTime() : obj.toISOString()) + ')';
    } else if(util.isSymbol(obj)) {
        return serializeSymbol(obj, options);
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
    } else if(util.isNumber(obj)) {
        switch(obj) {
            case Math.E:
                return 'Math.E';
            case Math.LN2:
                return 'Math.LN2';
            case Math.LN10:
                return 'Math.LN10';
            case Math.LOG2E:
                return 'Math.LOG2E';
            case Math.PI:
                return 'Math.PI';
            case Math.SQRT1_2:
                return 'Math.SQRT1_2';
            case Math.SQRT2:
                return 'Math.SQRT2';
            case Infinity:
                return options.compact ? '1/0' : 'Infinity';
            case -Infinity:
                return options.compact ? '1/-0' : '-Infinity';
        }
        if(Object.is(obj, -0)) return '-0';
        return String(obj);
    } else if(obj === true) {
        return options.compact ? '!0' : 'true';
    } else if(obj === false) {
        return options.compact ? '!1' : 'false';
    } else if(util.isString(obj)) {
        return JSON.stringify(obj);
    } else if(obj === undefined) {
        return options.compact ? 'void 0' : 'undefined';
    } else if(obj === null) {
        return 'null';
    } else if(util.isObject(obj)) {
        if(obj[isRaw]) {
            return obj.value;
        }
        if(util.isFunction(obj.toSource)) { // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/toSource
            return obj.toSource();
        }
        if(util.isFunction(obj.toJSON)) {
            return R(obj.toJSON());
        }
        // TODO: circular reference support
        let tmp = [];
        for(let key of Reflect.ownKeys(obj)) {
            tmp.push(serializePropertyName(key, options)+':'+R(obj[key]));
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

function serializeSymbol(sym, options) {
    let key = Symbol.keyFor(sym);
    if(key === undefined) {
        let m = sym.toString().match(/^Symbol\((.+)\)$/);
        if(m) {
            return `Symbol(${doSerialize(m[1], options)})`;
        }
        return `Symbol()`; // not sure if this is worthwhile or not
    } else {
        return `Symbol.for(${doSerialize(key, options)})`;
    }
}

const keywords = new Set(['do','if','in','for','let','new','try','var','case','else','enum','eval','false','null','this','true','void','with','break','catch','class','const','super','throw','while','yield','delete','export','import','public','return','static','switch','typeof','default','extends','finally','package','private','continue','debugger','function','arguments','interface','protected','implements','instanceof']);

const propName = XRegExp('^[$_\\p{Lu}\\p{Ll}\\p{Lt}\\p{Lm}\\p{Lo}\\p{Ll}][$_\\p{Lu}\\p{Ll}\\p{Lt}\\p{Lm}\\p{Lo}\\p{Ll}\\u200C\\u200D\\p{Mn}\\p{Mc}\\p{Nd}\\p{Pc}]*$');

function serializePropertyName(name, options) {
    if(util.isSymbol(name)) {
        return '['+serializeSymbol(name, options)+']';
    }
    if(util.isString(name)) {
        if(!options.safe || !keywords.has(name) && propName.test(name)) {
            return name;
        }
        return doSerialize(name, options);
    }

    throw new Error(`Cannot make property name`);
}

module.exports = jsSerialize;