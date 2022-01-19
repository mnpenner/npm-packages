import * as util from './util'

let nativeFuncs = new Map<Function,string>()
const isRaw = Symbol('isRaw')
let wellKnownSymbols: Map<symbol,string>
const EMPTY_ARRAY = Object.freeze<any>([])

function merge<T extends {}>(target: T, ...sources: Array<undefined | Partial<T>>): T {
    for(let obj of sources) {
        if(obj) {
            for(let key of Object.keys(obj)) {
                if(obj[key] !== undefined) {
                    target[key] = obj[key]
                }
            }
        }
    }
    return target
}

type Path = PropertyKey[]

interface Options {
    compact: boolean
    safe: boolean
}

interface Context {
    paths: Map<any, Path>,
    defer: any[],
}

export default function jsSerialize(object: any, options?: Partial<Options>): string {
    return serializeInner(object, options).replace(/<\/(script)/ig, '<\\/$1')
}

function serializeInner(object: any, options?: Partial<Options>): string {
    let opt = merge<Options>({
        compact: false,
        safe: true,
    }, options)

    let ctx: Context = {
        paths: new Map(),
        defer: [],
    }

    let out1 = serializeAny(object, opt, ctx, [])

    if(!ctx.defer.length) {
        return out1
    }

    // circular *or* repeated objects

    // console.log('defer',ctx.defer);

    const out2 = 'o=' + out1 + ','
        + ctx.defer.map(d => `o${pathToStr(d[0], opt)}=o${pathToStr(d[1], opt)}`).join(',') + ',o'

    if(opt.safe) {
        return `(function(o){return ${out2}})()`
    }
    return `(o=>(${out2}))()`

}

function pathToStr(path: string[], opt: Options) {
    return path.map(p => util.isStringLike(p) && isSafePropName(p, opt) ? `.${p}` : `[${serializeInner(p, opt)}]`).join('')
}

function isNegativeZero(value: number) {
    // https://stackoverflow.com/a/39280486/65387
    return 1 / value === -Infinity
}

function serializeAny(obj: any, opt: Options, ctx: Context, path: Path): string {
    if(util.isObject(obj)) {
        if(ctx.paths.has(obj)) {
            throw new Error(`Possible recursive loop`)
        }
        ctx.paths.set(obj, path)
    }

    if(util.isArray(obj)) {
        if(obj.length === 0) {
            return '[]'
        }
        let sb = []
        let hasProp = false
        for(let i = 0; i < obj.length; ++i) {
            if(obj.hasOwnProperty(i)) {
                hasProp = true
                let existingPath = ctx.paths.get(obj[i])
                if(existingPath) {
                    ctx.defer.push([[...path, i], existingPath])
                    sb.push('')
                } else {
                    sb.push(serializeAny(obj[i], opt, ctx, [...path, i]))
                }
            } else {
                sb.push('')
            }
        }
        if(!hasProp) {
            return `new Array(${obj.length})`
        }
        if(sb[sb.length - 1] === '') {
            sb.push('')
        }
        return '[' + sb.join(',') + ']'
    } else if(obj instanceof Set) {
        if(obj.size) {
            return 'new Set(' + serializeInner(Array.from(obj), opt) + ')'
        }
        return 'new Set'
    } else if(obj instanceof Map) {
        if(obj.size) {
            return 'new Map(' + serializeInner(Array.from(obj), opt) + ')'
        }
        return 'new Map'
    } else if(obj instanceof Date) {
        if(opt.compact) {
            return `new Date(${obj.valueOf()})`
        }
        const parts = [obj.getUTCFullYear(),obj.getUTCMonth(),obj.getUTCDate()]
        if((+obj % 86400000) !== 0) {
            parts.push(obj.getUTCHours(),obj.getUTCMinutes(),obj.getUTCSeconds())
            const ms = obj.getUTCMilliseconds()
            if(ms) {
                parts.push(ms)
            }
        }
        return `new Date(Date.UTC(${parts.join(',')}))`
    } else if(util.isSymbol(obj)) {
        if(!wellKnownSymbols) {
            wellKnownSymbols = new Map(
                Object.getOwnPropertyNames(Symbol)
                    .filter(k => util.isSymbol(Symbol[k]))
                    .map(k => [Symbol[k], k])
            )
        }
        let symbolName = wellKnownSymbols.get(obj)
        if(symbolName) {
            return `Symbol.${symbolName}`
        }
        return serializeSymbol(obj, opt)
    } else if(util.isNativeFunction(obj)) {
        let cachedPath = nativeFuncs.get(obj)

        if(cachedPath !== undefined) {
            return cachedPath
        }

        const foundPath = util.findFunction(global, obj)

        if(foundPath === null) {
            throw new Error(`Could not determine fully-qualified name of native function '${obj.name}'`)
        }

        const joinedPath = foundPath.join('.')
        nativeFuncs.set(obj, joinedPath)
        return joinedPath
    } else if(util.isFunction(obj)) {
        return obj.toString()
    } else if(util.isRegExp(obj)) {
        // return `/${obj.source}/${obj.flags}`;
        return obj.toString()
    } else if(util.isNumberLike(obj)) {
        return serializeNumberLike(obj, opt)
    } else if(util.isBigInt(obj)) {
        return `${obj}n`
    } else if(obj === true) {
        return opt.compact ? '!0' : 'true'
    } else if(obj === false) {
        return opt.compact ? '!1' : 'false'
    } else if(util.isStringLike(obj)) {
        return serializeStringLike(obj, opt)
    } else if(obj === undefined) {
        return opt.compact ? 'void 0' : 'undefined'
    } else if(obj === null) {
        return 'null'
    } else if(util.isObject(obj)) {
        const tmp = serializeObject(obj, opt, ctx, path)

        if(Object.isFrozen(obj)) {
            return `Object.freeze(${tmp})`
        }
        if(Object.isSealed(obj)) {
            return `Object.seal(${tmp})`
        }
        if(!Object.isExtensible(obj)) {
            return `Object.preventExtensions(${tmp})`
        }

        return tmp
    } else {
        throw new Error('Could not serialize unknown type')
    }
}

function serializeNumberLike(obj: number | Number, opt: Options) {
    const tmp = serializeNumber(Number(obj), opt)
    if(obj instanceof Number) {
        return `new Number(${tmp})`
    }
    return tmp
}

function serializeNumber(obj: number, opt: Options) {
    switch(obj) {
        // alternatively, search Object.getOwnPropertyNames(Math).filter(k => typeof Math[k] === 'number')
        case Math.E:
            return 'Math.E'
        case Math.LN2:
            return 'Math.LN2'
        case Math.LN10:
            return 'Math.LN10'
        case Math.LOG2E:
            return 'Math.LOG2E'
        case Math.PI:
            return 'Math.PI'
        case Math.SQRT1_2:
            return 'Math.SQRT1_2'
        case Math.SQRT2:
            return 'Math.SQRT2'
        // case Number.MAX_SAFE_INTEGER:
        //     return 'Number.MAX_SAFE_INTEGER'
        // case Number.MIN_SAFE_INTEGER:
        //     return 'Number.MIN_SAFE_INTEGER'
        case Number.EPSILON:
            return 'Number.EPSILON'
        case Infinity:
            return opt.compact ? '1/0' : 'Infinity'
        case -Infinity:
            return opt.compact ? '1/-0' : '-Infinity'
    }
    if(isNegativeZero(obj)) return '-0'
    if(opt.compact && Number.isInteger(obj) && obj >= 1000000000000) {
        return '0x' + obj.toString(16)
    }
    return String(obj)
}

function serializeStringLike(obj: string | String, opt: Options) {
    const tmp = serializeString(String(obj), opt)
    if(obj instanceof String) {
        return `new String(${tmp})`
    }
    return tmp
}

function serializeString(obj: string, opt: Options) {
    return '"' + Array.from(obj).map(ch => {
        const cp = ch.codePointAt(0)!
        switch(cp) {
            case 0x08:
                return '\\b'
            case 0x0C:
                return '\\f'
            case 0x0A:
                return '\\n'
            case 0x0D:
                return '\\r'
            case 0x09:
                return '\\t'
            case 0x0B:
                return opt.safe ? '\\x0B' : '\\v' // IE < 9 doesn't support \v
            // case 0x00: return '\\0'; // causes problems if the next character is a digit
            case 0x22:
                return '\\"'
            case 0x5C:
                return '\\\\'
        }
        if(cp >= 32 && cp <= 126) {
            return ch
        }
        if(cp <= 0xFF) {
            return '\\x' + cp.toString(16).padStart(2, '0')
        }
        if(cp <= 0xFFFF) {
            return '\\u' + cp.toString(16).padStart(4, '0')
        }
        return '\\u{' + cp.toString(16) + '}'
    }).join('') + '"'
}

function serializeObject(obj: any, opt: Options, ctx: Context, path: Path) {
    if(obj[isRaw]) {
        return obj.value
    }
    if(util.isFunction(obj.toSource)) { // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/toSource
        return obj.toSource()
    }
    if(util.isFunction(obj.toJSON)) {
        return serializeInner(obj.toJSON(), opt)
    }
    return serializePlainObject(obj, opt, ctx, path);
}

function serializePlainObject(obj: any, opt: Options, ctx: Context, path: Path) {
    let tmp = []
    for(let key of Reflect.ownKeys(obj)) {
        let existingPath = ctx.paths.get(obj[key])
        if(existingPath) {
            ctx.defer.push([[...path, key], existingPath])
        } else {
            tmp.push(serializePropertyName(key, opt, ctx) + ':' + serializeAny(obj[key], opt, ctx, [...path, key]))
        }
    }
    return '{' + tmp.join(',') + '}'
}

jsSerialize.raw = function raw(jsCode: string) {
    return Object.create({
        [isRaw]: true,
        value: jsCode,
    })
}

function serializeSymbol(sym: symbol, options: Options) {
    let key = Symbol.keyFor(sym)
    if(key === undefined) {
        let m = sym.toString().match(/^Symbol\((.+)\)$/)
        if(m) {
            return `Symbol(${serializeString(m[1], options)})`
        }
        return `Symbol()` // not sure if this is worthwhile or not
    } else {
        return `Symbol.for(${serializeString(key, options)})`
    }
}

const keywords = new Set(['do', 'if', 'in', 'for', 'let', 'new', 'try', 'var', 'case', 'else', 'enum', 'eval', 'false', 'null', 'this', 'true', 'void', 'with', 'break', 'catch', 'class', 'const', 'super', 'throw', 'while', 'yield', 'delete', 'export', 'import', 'public', 'return', 'static', 'switch', 'typeof', 'default', 'extends', 'finally', 'package', 'private', 'continue', 'debugger', 'function', 'arguments', 'interface', 'protected', 'implements', 'instanceof'])

const propName = /^[$_a-zA-Z][$_a-zA-Z0-9]*$/

function isSafePropName(name: string, options: Options) {
    return (!options.safe || !keywords.has(name)) && propName.test(name)
}

function serializePropertyName(name: PropertyKey, options: Options, ctx: Context) {
    if(util.isSymbol(name)) {
        return '[' + serializeSymbol(name, options) + ']'
    }
    if(util.isStringLike(name)) {
        if(isSafePropName(name, options)) {
            return name
        }
        return serializeString(name, options)
    }

    throw new Error(`Cannot make property name`)
}

