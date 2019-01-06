const util = require('./util');

let nativeFuncs = new Map();
const isRaw = Symbol('isRaw');
let wellKnownSymbols;

function merge(target, ...sources) {
    for(let obj of sources) {
        if(obj) {
            for(let key of Object.keys(obj)) {
                if(obj[key] !== undefined) {
                    target[key] = obj[key];
                }
            }
        }
    }
    return target;
}

function serialize1(object, options) {
    return serialize2(object,options).replace(/<\/(script)/ig, '<\\/$1');
}

function serialize2(object, options) {
    let opt = merge({
        compact: false,
        safe: true,
    }, options);
    
    let ctx = {
        paths: new Map(),
        defer: [],
    };
    
    let out1 = serialize3(object, opt, ctx, []);
    
    if(!ctx.defer.length) {
        return out1;
    }
    
    // circular *or* repeated objects
    
    // console.log('defer',ctx.defer);

    const out2 = 'o='+out1+';'
        + ctx.defer.map(d => `o${pathToStr(d[0],opt)}=o${pathToStr(d[1],opt)}`).join(';');
    
    const out3 = `(${opt.safe?'function(o)':'o=>'}{${out2};return o})()`;
    
    // console.log(out3);

    return out3;
}

function pathToStr(path, opt) {
    // console.log('pathToStr',path);
    
    return path.map(p => util.isString(name) && isSafePropName(p,opt) ? `.${p}` : `[${serialize2(p,opt)}]`).join('');
}

function isNegativeZero(value) {
    // https://stackoverflow.com/a/39280486/65387
    return 1/value === -Infinity;
}

function serialize3(obj, opt, ctx, path) {
    if(util.isObject(obj)) {
        if(ctx.paths.has(obj)) {
            throw new Error(`Possible recursive loop`);
        }
        ctx.paths.set(obj, path);
    }

    if(util.isArray(obj)) {
        if(obj.length === 0) {
            return '[]';
        }
        let sb = [];
        let hasProp = false;
        for(let i=0; i<obj.length; ++i) {
            if(obj.hasOwnProperty(i)) {
                hasProp = true;
                let existingPath = ctx.paths.get(obj[i]);
                if(existingPath) {
                    ctx.defer.push([[...path,i],existingPath]);
                    sb.push('');
                } else {
                    sb.push(serialize3(obj[i], opt, ctx, [...path, i]));
                }
            } else {
                sb.push('');
            }
        }
        if(!hasProp) {
            return `new Array(${obj.length})`;
        }
        if(sb[sb.length - 1] === '') {
            sb.push('');
        }
        return '[' +  sb.join(',') + ']';
    } else if(obj instanceof Set) {
        if(obj.size) {
            return 'new Set(' + serialize2(Array.from(obj),opt) + ')';
        }
        return 'new Set';
    } else if(obj instanceof Map) {
        if(obj.size) {
            return 'new Map(' + serialize2(Array.from(obj),opt) + ')';
        }
        return 'new Map';
    } else if(obj instanceof Date) {
        return 'new Date(' + serialize2(obj.valueOf(),opt) + ')';
    } else if(util.isSymbol(obj)) {
        if(!wellKnownSymbols) {
            wellKnownSymbols = new Map(
                Object.getOwnPropertyNames(Symbol)
                    .filter(k => util.isSymbol(Symbol[k]))
                    .map(k => [Symbol[k],k])
            );
        }
        let symbolName = wellKnownSymbols.get(obj);
        if(symbolName) {
            return `Symbol.${symbolName}`;
        }
        return serializeSymbol(obj, opt, ctx);
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
            // alternatively, search Object.getOwnPropertyNames(Math).filter(k => typeof Math[k] === 'number')
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
                return opt.compact ? '1/0' : 'Infinity';
            case -Infinity:
                return opt.compact ? '1/-0' : '-Infinity';
        }
        if(isNegativeZero(obj)) return '-0';
        return String(obj);
    } else if(obj === true) {
        return opt.compact ? '!0' : 'true';
    } else if(obj === false) {
        return opt.compact ? '!1' : 'false';
    } else if(util.isString(obj)) {
        return '"' + Array.from(obj).map(ch => {
            const cp = ch.codePointAt(0);
            if(cp >= 32 && cp <= 126) {
                if(ch === '"') return '\\"';
                if(ch === '\\') return '\\\\';
                return ch;
            }
            if(cp <= 0xFF) {
                return '\\x' + cp.toString(16).padStart(2,'0');
            }
            if(cp <= 0xFFFF) {
                return '\\u' + cp.toString(16).padStart(4,'0');
            }
            return '\\u{' + cp.toString(16) + '}';
        }).join('') + '"';
    } else if(obj === undefined) {
        return opt.compact ? 'void 0' : 'undefined';
    } else if(obj === null) {
        return 'null';
    } else if(util.isObject(obj)) {
        const tmp = serializeObject(obj, opt, ctx, path);
        
        if(Object.isFrozen(obj)) {
            return `Object.freeze(${tmp})`;
        }
        
        return tmp;
    } else {
        throw new Error('Could not serialize unknown type');
    }
}

function serializeObject(obj, opt, ctx, path) {
    if(obj[isRaw]) {
        return obj.value;
    }
    if(util.isFunction(obj.toSource)) { // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/toSource
        return obj.toSource();
    }
    if(util.isFunction(obj.toJSON)) {
        return serialize2(obj.toJSON(),opt);
    }
    let tmp = [];
    for(let key of Reflect.ownKeys(obj)) {
        let existingPath = ctx.paths.get(obj[key]);
        if(existingPath) {
            ctx.defer.push([[...path,key],existingPath]);
        } else {
            tmp.push(serializePropertyName(key, opt, ctx) + ':' + serialize3(obj[key], opt, ctx, [...path, key]));
        }
    }
    return '{' + tmp.join(',') + '}';
}

/**
 * @param {string} jsCode
 */
serialize1.raw = function raw(jsCode) {
    return Object.create({
        [isRaw]: true,
        value: jsCode,
    });
};

function serializeSymbol(sym, options, ctx) {
    let key = Symbol.keyFor(sym);
    if(key === undefined) {
        let m = sym.toString().match(/^Symbol\((.+)\)$/);
        if(m) {
            return `Symbol(${serialize3(m[1], options, ctx)})`;
        }
        return `Symbol()`; // not sure if this is worthwhile or not
    } else {
        return `Symbol.for(${serialize3(key, options, ctx)})`;
    }
}

const keywords = new Set(['do','if','in','for','let','new','try','var','case','else','enum','eval','false','null','this','true','void','with','break','catch','class','const','super','throw','while','yield','delete','export','import','public','return','static','switch','typeof','default','extends','finally','package','private','continue','debugger','function','arguments','interface','protected','implements','instanceof']);

const propName = /^[$_a-zA-Z][$_a-zA-Z0-9]*$/;

function isSafePropName(name, options) {
    return (!options.safe || !keywords.has(name)) && propName.test(name);
}

function serializePropertyName(name, options, ctx) {
    if(util.isSymbol(name)) {
        return '['+serializeSymbol(name, options, ctx)+']';
    }
    if(util.isString(name)) {
        if(isSafePropName(name, options)) {
            return name;
        }
        return serialize3(name, options, ctx);
    }

    throw new Error(`Cannot make property name`);
}

module.exports = serialize1;