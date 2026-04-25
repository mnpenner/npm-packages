import * as util from './util'

let nativeFuncs = new Map<Function,string>()
const isRaw = Symbol('isRaw')
let wellKnownSymbols: Map<symbol,string>
const EMPTY_ARRAY = Object.freeze<any>([])



function merge<T extends {}>(target: T, ...sources: Array<undefined | Partial<T>>): T {
    for(let obj of sources) {
        if(obj) {
            for(let key of Object.keys(obj)) {
                // @ts-ignore
                if(obj[key] !== undefined) {
                    // @ts-ignore
                    target[key] = obj[key]
                }
            }
        }
    }
    return target
}

type Path = PropertyKey[]

interface Options {
    /** Make the output code slightly more compact (and harder to read) */
    compact: boolean
    /** Slightly improve compatibility with older browsers */
    safe: boolean
}

interface Context {
    seen: Set<any>,
    refs: Map<any,string>,  // TODO: combine 'seen' into refs; e.g. {seen: boolean, name:string}
    opts: Options,
}

function jsSerialize(object: any, options?: Partial<Options>): string {
    return startSerialize(object, options).replace(/<\/(script)/ig, '<\\/$1')
}

function startSerialize(object: any, options?: Partial<Options>): string {
    const counts = referenceCount(object);

    let c = 0;
    const dupes: [any,string][] = [...counts]
        .filter(x => x[1] > 1)
        .sort((a,b) => b[1]-a[1])
        .map(x => [x[0], `$${c++}`])
    // console.log(dupes)
    const refs = new Map(dupes)
    // console.log(refs)

    let ctx: Context = {
        seen: new Set,
        refs,
        opts: Object.freeze(merge<Options>({
            compact: false,
            safe: true,
        }, options)),
    }

    let js = serializeAny(object, ctx);

    if(dupes.length) {
        let varDecl = dupes.map(x=>x[1]).join(',')
        if(dupes.length > 1) {
            varDecl = `(${varDecl})`
        }
        if(js.startsWith('{')) {
            js = `(${js})`
        }
        return `(${varDecl}=>${js})()`
    }

    return js
}

const STRING_REF_MIN_LENGTH = 12

function referenceCount(object: any): Map<any,number> {
    const m = new Map
    function r(o: any) {
        let c = m.get(o)
        if(c)  {
            m.set(o,c+1)
            return
        }
        if(util.isArray(o) || o instanceof Set) {
            m.set(o,1)
            for(const v of o) {
                r(v)
            }
        } else if(util.isString(o)) {
            if(o.length >= STRING_REF_MIN_LENGTH) {  // TODO: make this part of the "compact" option
                m.set(o,1)
            }
        } else if(o instanceof Map) {
            m.set(o,1)
            for(const v of o.values()) {
                r(v)
            }
        } else if(util.isRegExp(o) || o instanceof Date || util.isSymbol(o) || util.isFunction(o)) {
            m.set(o,1)
        } else if(util.isObject(o)) {  // process object last because it'll get caught by some of the above stuff
            m.set(o,1)
            for(const k of Reflect.ownKeys(o)) {
                // @ts-ignore
                r(o[k])
            }
        }
    }
    r(object)
    return m
}


function isNegativeZero(value: number) {
    // https://stackoverflow.com/a/39280486/65387
    return 1 / value === -Infinity
}


function serializeArray(obj: any[], ctx: Context) {
    const varName = ctx.refs.get(obj)
    const assign = varName ? `${varName}=` : '';
    if(obj.length === 0) {
        return `${assign}[]`
    }
    let sb: string[] = []
    let hasProp = false
    let isSparse = false
    for(let i = 0; i < obj.length; ++i) {
        if(obj.hasOwnProperty(i)) {
            hasProp = true
            sb.push(serializeAny(obj[i], ctx))
        } else {
            isSparse = true
            sb.push('')
        }
    }
    if(!hasProp) {
        return `${assign}new Array(${obj.length})`
    }
    if(sb[sb.length - 1] === '') {
        sb.push('')
    }
    const inner = sb.join(',')
    if(varName) {
        if(isSparse) {
            // FIXME: this is re-doing work done in the above loop...optimize this
            let sb=[`(${varName}=new Array(${obj.length})`]
            for(let i = 0; i < obj.length; ++i) {
                if(obj.hasOwnProperty(i)) {
                    sb.push(`${varName}[${i}]=${serializeAny(obj[i], ctx)}`)
                }
            }
            sb.push(`${varName})`)
            return sb.join(',')
        }
        return `(${varName}=[],${varName}.push(${inner}),${varName})`
    }
    return `[${inner}]`
}

function serializeSet(obj: Set<any>, ctx: Context) {
    const varName = ctx.refs.get(obj)
    if(obj.size) {
        if(varName) {
            return `(${varName}=new Set,${varName}` +Array.from(obj).map(x => `.add(${serializeAny(x,ctx)})`).join('')+')'
        }
        return 'new Set(' + serializeAny(Array.from(obj), ctx) + ')'
    }
    if(varName) {
        return `${varName}=new Set`
    }
    return 'new Set'
}

function serializeMap(obj: Map<any,any>, ctx: Context) {
    const varName = ctx.refs.get(obj)
    if(obj.size) {
        if(varName) {
            return `(${varName}=new Map,${varName}` +Array.from(obj).map(([k,v]) => `.set(${serializeAny(k,ctx)},${serializeAny(v,ctx)})`).join('')+')'
        }
        return 'new Map(' + serializeAny(Array.from(obj), ctx) + ')'
    }
    if(varName) {
        return `${varName}=new Map`
    }
    return 'new Map'
}

function serializeDate(obj: Date, ctx: Context) {
    if(ctx.opts.compact) {
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
}

type SerializerFunc = (obj:any, ctx: Context) => string

function wrapSimpleRef(serialize: SerializerFunc) {
    return (obj: any, ctx: Context) => {
        const js = serialize(obj, ctx)
        const varName = ctx.refs.get(obj)
        if(varName) {
            ctx.seen.add(obj)
            return `${varName}=${js}`
        }
        return js
    }
}

function serializeAnySymbol(obj: symbol, ctx: Context) {
    if(!wellKnownSymbols) {
        // @ts-ignore
        wellKnownSymbols = new Map(
            Object.getOwnPropertyNames(Symbol)
                // @ts-ignore
                .filter(k => util.isSymbol(Symbol[k]))
                // @ts-ignore
                .map(k => [Symbol[k], k])
        )
    }
    let symbolName = wellKnownSymbols.get(obj)
    if(symbolName) {
        return `Symbol.${symbolName}`
    }
    return serializeSymbol(obj, ctx)
}

function serializeNativeFunction(obj: Function, ctx: Context) {
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
}

function serializeNonNativeFunction(obj: Function, ctx: Context) {
    return obj.toString()
}

function serializeAnyFunction(obj: Function, ctx: Context) {
    if(/\{\s*\[native code]\s*}$/.test(obj.toString())) {
        return serializeNativeFunction(obj, ctx)
    }
    return serializeNonNativeFunction(obj, ctx)
}

function serializeBoolean(obj: boolean, ctx: Context) {
    if(obj) {
        return ctx.opts.compact ? '!0' : 'true'
    }
    return ctx.opts.compact ? '!1' : 'false'
}

function escapeUnsafeHtml(str: string) {
    return str.replace(/<!--/g, '\\x3c!--')
              .replace(/<script/gi, '\\x3cscript')
              .replace(/-->/g, '--\\x3e')
}

function serializeRegExp(obj: RegExp, ctx: Context) {
    if (ctx.opts.safe) {
        return `new RegExp(${serializeString(obj.source, ctx)},${serializeString(obj.flags, ctx)})`
    }
    return escapeUnsafeHtml(obj.toString())
}

function serializeUndefined(obj: undefined, ctx: Context) {
    return ctx.opts.compact ? 'void 0' : 'undefined'
}

function serializeNull(obj: null, ctx: Context) {
    return 'null'
}

function maybeFreeze(obj: any, js: string) {
    if(Object.isFrozen(obj)) {
        return `Object.freeze(${js})`
    }
    if(Object.isSealed(obj)) {
        return `Object.seal(${js})`
    }
    if(!Object.isExtensible(obj)) {
        return `Object.preventExtensions(${js})`
    }
    return js
}

function serializeAnyObject(obj: any, ctx: Context) {
    const tmp = serializeObject(obj, ctx)
    const name = ctx.refs.get(obj)
    if(name) {
        if(Reflect.ownKeys(obj).length) {
            return `(${name}={},${maybeFreeze(obj,`Object.assign(${name},${tmp})`)})`
        }
        return `${name}=${maybeFreeze(obj,'{}')}`
    }
    return maybeFreeze(obj,tmp)
}

function serializeAny(obj: any, ctx: Context): string {
    if(ctx.seen.has(obj) && ctx.refs.has(obj)) {
        return ctx.refs.get(obj)!
    }
    if(util.isArray(obj)) {
        ctx.seen.add(obj)
        return serializeArray(obj, ctx);
    }
    if(obj instanceof Set) {
        ctx.seen.add(obj)
        return serializeSet(obj, ctx);
    }
    if(obj instanceof Map) {
        ctx.seen.add(obj)
        return serializeMap(obj, ctx);
    }
    if(obj instanceof Date) {
        return wrapSimpleRef(serializeDate)(obj, ctx);
    }
    if(util.isSymbol(obj)) {
        return wrapSimpleRef(serializeAnySymbol)(obj, ctx);
    }
    if(util.isFunction(obj)) {
        return wrapSimpleRef(serializeAnyFunction)(obj, ctx);
    }
    if(util.isRegExp(obj)) {
        return wrapSimpleRef(serializeRegExp)(obj, ctx);
    }
    if(util.isNumberLike(obj)) {
        return serializeNumberLike(obj, ctx)
    }
    if(util.isBigInt(obj)) {
        return serializeBigInt(obj, ctx)
    }
    if(util.isBoolean(obj)) {
        return serializeBoolean(obj, ctx)
    }
    if(util.isStringLike(obj)) {
        return serializeStringLike(obj, ctx)
    }
    if(obj === undefined) {
        return serializeUndefined(obj, ctx)
    }
    if(obj === null) {
        return serializeNull(obj, ctx)
    }
    if(util.isObject(obj)) {
        ctx.seen.add(obj)
        return serializeAnyObject(obj, ctx)
    }
    throw new Error('Could not serialize unknown type')
}

function serializeNumberLike(obj: number | Number, ctx: Context) {
    const tmp = serializeNumber(Number(obj), ctx)
    if(obj instanceof Number) {
        return `new Number(${tmp})`
    }
    return tmp
}

function serializeNumber(obj: number, ctx: Context) {
    switch(obj) {
        // alternatively, search Object.getOwnPropertyNames(Math).filter(k => typeof Math[k] === 'number')
        case Math.E:
            return 'Math.E'
        case Math.LN2:
            return 'Math.LN2'
        case Math.LN10:
            return 'Math.LN10'
        case Math.LOG10E:
            return 'Math.LOG10E'
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
            return ctx.opts.compact ? '1/0' : 'Infinity'
        case -Infinity:
            return ctx.opts.compact ? '1/-0' : '-Infinity'
    }
    if(isNegativeZero(obj)) return '-0'
    if(ctx.opts.compact && Number.isInteger(obj) && obj >= 1000000000000) {
        return '0x' + obj.toString(16)
    }
    return String(obj)
}

function serializeBigInt(obj: bigint, ctx: Context) {
    if(ctx.opts.compact && obj >= 1000000000000n) {
        return '0x' + obj.toString(16) + 'n'
    }
    return `${obj}n`
}

function serializeStringLike(obj: string | String, ctx: Context) {
    const js = doSerializeStringLike(obj, ctx)
    if(obj.length >= STRING_REF_MIN_LENGTH) {
        const varName = ctx.refs.get(obj)
        if(varName) {
            ctx.seen.add(obj)
            return `${varName}=${js}`
        }
    }
    return js
}

function doSerializeStringLike(obj: string | String, ctx: Context) {
    const tmp = serializeString(String(obj), ctx)
    if(obj instanceof String) {
        return `new String(${tmp})`
    }
    return tmp
}

function serializeString(obj: string, ctx: Context) {
    let numDouble = 0
    let numSingle = 0
    for(let i=0; i<obj.length; i++) {
        if (obj[i] === '"') ++numDouble
        else if (obj[i] === "'") ++numSingle
    }
    const useSingle = numDouble > numSingle
    const quote = useSingle ? "'" : '"'
    const quoteCode = useSingle ? 0x27 : 0x22

    let result = quote + Array.from(obj).map(ch => {
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
                return ctx.opts.safe ? '\\x0B' : '\\v' // IE < 9 doesn't support \v
            // case 0x00: return '\\0'; // causes problems if the next character is a digit
            case quoteCode:
                return '\\' + ch
            case 0x5C:
                return '\\\\'
            case 0x3C:
                return ctx.opts.safe ? '\\x3c' : '<'
            case 0x3E:
                return ctx.opts.safe ? '\\x3e' : '>'
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
    }).join('') + quote

    if (!ctx.opts.safe) {
        result = escapeUnsafeHtml(result)
    }
    return result
}

function serializeObject(obj: any, ctx: Context) {
    if(obj[isRaw]) {
        return obj.value
    }
    if(util.isFunction(obj.toSource)) { // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/toSource
        return obj.toSource()
    }
    if(util.isFunction(obj.toJSON)) {
        return serializeAny(obj.toJSON(), ctx)
    }
    return serializePlainObject(obj, ctx);
}

function serializePlainObject(obj: any,  ctx: Context) {
    let tmp: string[] = []
    for(let key of Reflect.ownKeys(obj)) {
        tmp.push(serializePropertyName(key, ctx) + ':' + serializeAny(obj[key], ctx))
    }
    return '{' + tmp.join(',') + '}'
}

jsSerialize.raw = function raw(jsCode: string) {
    return Object.create({
        [isRaw]: true,
        value: jsCode,
    })
}

function serializeSymbol(sym: symbol, ctx: Context) {
    let key = Symbol.keyFor(sym)
    if(key === undefined) {
        let m = sym.toString().match(/^Symbol\((.+)\)$/)
        if(m) {
            return `Symbol(${serializeString(m[1], ctx)})`
        }
        return `Symbol()` // not sure if this is worthwhile or not
    } else {
        return `Symbol.for(${serializeString(key, ctx)})`
    }
}

const keywords = new Set(['do', 'if', 'in', 'for', 'let', 'new', 'try', 'var', 'case', 'else', 'enum', 'eval', 'false', 'null', 'this', 'true', 'void', 'with', 'break', 'catch', 'class', 'const', 'super', 'throw', 'while', 'yield', 'delete', 'export', 'import', 'public', 'return', 'static', 'switch', 'typeof', 'default', 'extends', 'finally', 'package', 'private', 'continue', 'debugger', 'function', 'arguments', 'interface', 'protected', 'implements', 'instanceof'])

const propName = /^[$_a-zA-Z][$_a-zA-Z0-9]*$/

function isSafePropName(name: string, ctx: Context) {
    return (!ctx.opts.safe || !keywords.has(name)) && propName.test(name)
}

function serializePropertyName(name: PropertyKey, ctx: Context) {
    if(util.isSymbol(name)) {
        return '[' + serializeSymbol(name, ctx) + ']'
    }
    if(util.isStringLike(name)) {
        if(isSafePropName(name, ctx)) {
            return name
        }
        return serializeString(name, ctx)
    }

    throw new Error(`Cannot make property name`)
}

export default jsSerialize
