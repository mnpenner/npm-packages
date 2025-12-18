// https://tools.ietf.org/html/rfc6570#section-3.2.1

const PREFIX_RE = /^[+#./;?&]/
const MODIFIER_RE = /(?<repeat>\*)?(?::(?<func>[a-zA-Z][a-zA-Z0-9_]*))?(?::(?:(?<length>\d+)))?$/ /* FIXME: If it is an explode ("*"), scan the next character.  If it is a
      prefix (":"), continue scanning the next one to four characters
      for the max-length represented as a decimal integer and then, if
      it is still not the end of the expression, scan the next
      character. */

const UNRESERVED = /[^a-zA-Z0-9\-._~]+/ugs
const UR_SET = /[^a-zA-Z0-9\-._~:\/?#[\]@!$&'()*+,;=]+/ugs
const PERCENT_RE = /^%[0-9a-fA-F]{2}$/

const STR = Symbol('string')
const VAR = Symbol('var')

interface Placeholder {
    type: typeof VAR
    prefix: string
    vars: VarSpec[]
}

interface StringLiteral {
    type: typeof STR
    value: string
}

type TemplateParts = Array<Placeholder | StringLiteral>

interface VarSpec {
    name: string
    /** Max length, in characters. */
    length: number | null
    func: string | null
    repeat: boolean
}

/*
Character set definitions:  https://tools.ietf.org/html/rfc6570#section-1.5
Reserved Expansion: {+var}:  https://tools.ietf.org/html/rfc6570#section-3.2.3
 */

const SeparatorMap: Record<string, string> = {
    '': ',',
    '+': ',',
    '.': '.',
    '/': '/',
    ';': ';',
    '?': '&',
    '&': '&',
    '#': ',',
}
const FirstMap: Record<string, string> = {
    '': '',
    '+': '',
    '.': '.',
    '/': '/',
    ';': ';',
    '?': '?',
    '&': '&',
    '#': '#',
}

const Named: Record<string, boolean> = {
    '': false,
    '+': false,
    '.': false,
    '/': false,
    ';': true,
    '?': true,
    '&': true,
    '#': false,
}

const IfEmp: Record<string, string> = {
    '': '',
    '+': '',
    '.': '',
    '/': '',
    ';': '',
    '?': '=',
    '&': '=',
    '#': '',
}

const ReservedExpansion: Record<string, boolean> = {
    '': false,
    '+': true,  // https://datatracker.ietf.org/doc/html/rfc6570#section-3.2.3
    '.': false,
    '/': false,
    ';': false,
    '?': false,
    '&': false,
    '#': true,  // https://datatracker.ietf.org/doc/html/rfc6570#section-3.2.4
}

enum VarType {
    NAMED,
    STATIC,
    DYNAMIC
}

type MapItem = {
    type: VarType.DYNAMIC
    var: VarSpec
    prefix: string
} | {
    type: VarType.NAMED
    vars: VarSpec[]
    prefix: string
} | {
    type: VarType.STATIC
}


export class UriTemplate<P extends UriParams> {

    expandParts: TemplateParts
    matchRegex: RegExp
    matchMap: Map<string, MapItem>

    constructor(template: string) {
        this.expandParts = []
        const re: string[] = ['^']
        this.matchMap = new Map()

        let pos = 0
        const matches = Array.from(template.matchAll(/\{(.+?)\}/g)) as Required<RegExpMatchArray>[]
        let matchCounter = 0

        for(const m of matches) {
            if(m.index! > pos) {
                const lit = template.slice(pos, m.index)
                this.expandParts.push({
                    type: STR,
                    value: lit
                })
                const groupName = `static${matchCounter++}`
                re.push(`(?<${groupName}>${escapeRegExp(lit)})`)
                this.matchMap.set(groupName, {type: VarType.STATIC})
            }
            pos = m.index! + m[0].length
            const ph: Placeholder = {
                type: VAR,
                prefix: '',
                vars: [],
            }
            this.expandParts.push(ph)
            let varStr = m[1]
            const prefix = varStr.match(PREFIX_RE)
            if(prefix) {
                varStr = varStr.slice(1)
                ph.prefix = prefix[0]
            }
            const vars = varStr.split(',')


            const isNamed = Named[ph.prefix]
            let isFirst = true

            if(!isNamed) {
                re.push(escapeRegExp(FirstMap[ph.prefix]))
            }

            for(const v of vars) {
                const item: VarSpec = {
                    name: v,
                    length: null,
                    func: null,
                    repeat: false,
                }

                const mod = v.match(MODIFIER_RE) as Required<RegExpMatchArray> | null
                if(mod) {
                    if(mod.groups!.repeat !== undefined) {
                        item.repeat = true
                    }
                    if(mod.groups!.length !== undefined) {
                        item.length = Number(mod.groups!.length)
                    }
                    if(mod.groups!.func !== undefined) {
                        item.func = mod.groups.func
                    }
                    item.name = item.name.slice(0, mod.index)
                }
                ph.vars.push(item)


                if(!isNamed) {
                    if(!isFirst) {
                        re.push(escapeRegExp(SeparatorMap[ph.prefix]))
                    }

                    let groupName = item.name
                    if(!/^[a-z][a-z0-9_]*$/i.test(groupName)) {
                        groupName = 'param'
                    }
                    groupName += String(matchCounter++)
                    re.push(`(?<${groupName}>`)
                    if(item.func != null) {
                        switch(item.func) {
                            case 'int':
                                if(item.length != null) {
                                    re.push(`\\d{${item.length}}`)
                                } else {
                                    re.push('-?\\d+')
                                }
                                break
                            default:
                                throw new Error(`Unrecognized UriTemplate func: ${item.func}`)
                        }
                    } else {
                        let ch: string
                        if(ph.prefix === '+') {
                            ch = '[^?#]'
                        } else if(ph.prefix === '#') {
                            ch = '.'
                        } else if(ph.prefix === '/' && item.repeat) {
                            ch = '[^?#]'
                        } else {
                            ch = '[^/?#]'
                        }
                        if(item.length != null) {
                            ch = `(?:%[0-9a-fA-F]{2}|${ch})`
                            re.push(ch, `{${item.length}}`)
                        } else {
                            re.push(ch, '+?')
                        }
                    }

                    re.push(')')
                    this.matchMap.set(groupName, {var: item, type: VarType.DYNAMIC, prefix: ph.prefix})
                }

                isFirst = false
            }

            if(isNamed) {
                re.push('(?:', escapeRegExp(FirstMap[ph.prefix]))
                const groupName = `kwargs${matchCounter++}`
                re.push(`(?<${groupName}>[^/?#]*)`)
                re.push(')?')
                this.matchMap.set(groupName, {vars: ph.vars, type: VarType.NAMED, prefix: ph.prefix})
            }


        }
        if(pos < template.length) {
            const lit = template.slice(pos)
            this.expandParts.push({
                type: STR,
                value: lit
            })
            const groupName = `static${matchCounter++}`
            re.push(`(?<${groupName}>${escapeRegExp(lit)})`)
            this.matchMap.set(groupName, {type: VarType.STATIC})
        }
        // TODO: default values
        // https://docs.microsoft.com/en-us/dotnet/framework/wcf/feature-details/uritemplate-and-uritemplatetable TODO:
        // regex or int conditionals log(matches,template,this.placeholders); log(this.parts); process.exit(0);

        re.push('$')
        this.matchRegex = new RegExp(re.join(''))
    }

    expand(variables: P): string {
        const out = []
        for(const p of this.expandParts) {
            switch(p.type) {
                case VAR:
                    const vs: string[] = []
                    for(const v of p.vars) {
                        if(Object.hasOwn(variables, v.name)) {
                            const x = variables[v.name]
                            if(x == null) continue
                            const sep = v.repeat ? SeparatorMap[p.prefix] : ','
                            const esc = (x: Primitive|PrimitivePair) => percentEncodeRegExp(x, ReservedExpansion[p.prefix], v.length, v.repeat ? '=' : ',')
                            let pre = ''
                            if(Named[p.prefix]) {
                                pre = v.name + (isEmpty(x) ? IfEmp[p.prefix] : '=')
                            }
                            if(Array.isArray(x)) {
                                if(x.length) {
                                    // TODO: rethink how these are encoded. maybe CSV format?
                                    vs.push((v.repeat ? '' : pre) + x.map(z => (v.repeat ? pre : '') + esc(z)).join(sep))
                                }
                            } else if(typeof x === 'object') {
                                if(Object.keys(x).length) {
                                    // TODO: rethink how these are encoded. maybe JSON (unquoted)?
                                    vs.push((v.repeat ? '' : pre) + Object.entries(x).map(([ok, ov]) => `${esc(ok)}${v.repeat ? '=' : ','}${esc(ov)}`).join(sep))
                                }
                            } else {
                                vs.push(pre + esc(x))
                            }
                        }
                    }
                    if(vs.length) {
                        out.push(FirstMap[p.prefix], vs.join(SeparatorMap[p.prefix]))
                    }
                    break
                case STR:
                    out.push(p.value)
                    break
            }
        }
        return out.join('')
    }

    match(url: string): UriMatch<P> | null {
        // https://reach.tech/router/ranking

        let score = 0
        const m = url.match(this.matchRegex)
        // console.log(`${JSON.stringify(url)}.match(${this.matchRegex})`);
        if(m !== null) {
            // log('m',m);
            let params: Array<[string, UrlParamValue]> = []
            if(m.groups != null) {
                // log('m.groups',m.groups)
                for(const [k, v] of Object.entries(m.groups)) {
                    const itemSpec = this.matchMap.get(k)!
                    let value: UrlParamValue

                    switch(itemSpec.type) {
                        case VarType.NAMED: {
                            const parsed = v == null ? Object.create(null) : parseParams(v, SeparatorMap[itemSpec.prefix])
                            // console.log('parseParams',v, SeparatorMap[itemSpec.prefix],parsed);

                            for(const vs of itemSpec.vars) {
                                if(vs.repeat) {
                                    score -= 1
                                    if(isEmpty(parsed)) {
                                        params.push([vs.name, EMPTY_OBJ])
                                    } else {
                                        params.push([vs.name, mapValues(parsed, x => formatElement(x, vs))])
                                    }
                                    break
                                } else {
                                    if(parsed[vs.name] !== undefined) {
                                        score += 2
                                        params.push([vs.name, formatElement(parsed[vs.name], vs)])
                                        delete parsed[vs.name]
                                    } else {
                                        params.push([vs.name, null])
                                    }
                                }
                            }
                        }
                            break
                        case VarType.DYNAMIC: {
                            score += 2
                            if(v == null) {
                                if(itemSpec.var.repeat) {
                                    if(Named[itemSpec.prefix]) {
                                        value = EMPTY_OBJ
                                    } else {
                                        value = EMPTY_ARR as any
                                    }
                                } else {
                                    value = null
                                }
                            } else {
                                value = v
                                if(itemSpec.var.repeat) {
                                    value = value.split(SeparatorMap[itemSpec.prefix]).map(x => formatElement(x, itemSpec.var)) as string[] | number[]
                                } else {
                                    value = formatElement(value, itemSpec.var)
                                }
                            }
                            params.push([itemSpec.var.name, value])
                        }
                            break
                        case VarType.STATIC: {
                            score += 3
                        }
                            break
                    }
                }
            }
            return {
                score,
                params: Object.fromEntries(params) as P,
            }
        }
        return null
    }
}


function formatElement(str: string | null, varSpec: VarSpec) {
    if(str == null) return null
    let out: UrlParamValue = decodeURIComponent(str)
    if(varSpec.length != null) {
        out = out.slice(0, varSpec.length)
    }
    if(varSpec.func === 'int') {
        out = Number(out)
    }
    return out
}

function mapValues<ValueIn = any, ValueOut = any>(obj: Record<string, ValueIn>, callback: (value: ValueIn) => ValueOut) {
    return Object.fromEntries(Object.entries(obj).map(([key, value]) => [key, callback(value)]))
}


function parseParams(queryString: string, separator: string): Record<string, string | null> {
    // log('parseParams',queryString,separator)
    const pairs = queryString.split(separator)
    return Object.fromEntries(pairs.map(pair => {
        const idx = pair.indexOf('=')
        if(idx === -1) {
            return [pair, null]
        }
        const key = pair.slice(0, idx)
        const value = pair.slice(idx + 1)
        return [key, value]
    }))
}

const EMPTY_OBJ = Object.freeze(Object.create(null))
const EMPTY_ARR = Object.freeze([])

function isEmpty(x: any): x is null | undefined | '' | [] | {} {
    return x == null || x === '' || (Array.isArray(x) ? !x.length : (typeof x === 'object' && !Object.keys(x).length))
}


type Primitive = string | number | boolean | null
type PrimitivePair = [key:string,value:Primitive]
type PrimitiveMap = {[K in string]: Primitive}
export type UrlParamValue = Primitive | Primitive[] | PrimitivePair[] | PrimitiveMap;

function escapeRegExp(string: string) {
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#Escaping
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // $& means the whole matched string
}

export function fullWide(n: number): string {
    try {
        return n.toLocaleString('en-US', {useGrouping: false, maximumFractionDigits: 20})
    } catch {
        return n.toFixed(14).replace(/\.?0+$/, '')
    }
}

function percentEncodeRegExp(value: Primitive|PrimitivePair, reserved: boolean, length: number | null, separator: string): string {
    if(typeof value === 'number') {
        return fullWide(value)
    }
    if(value === true) return '1'
    if(value === false) return '0'
    if(value == null) return ''

    if(Array.isArray(value)) {
        return value.map(v => percentEncodeRegExp(v,reserved,length,separator)).join(separator)
    }

    if(length != null) {
        value = value.slice(0, length)
    }

    if(reserved) {
        return value.replace(/%[0-9a-fA-F]{2}|./ugs, m => {
            let v = PERCENT_RE.test(m) ? decodeURIComponent(m) : m
            if(UR_SET.test(v)) {
                return percentEncode(v)
            }
            return m
        })
    }
    return value.replace(UNRESERVED, percentEncode)
}


const UTF8_ENCODER = new TextEncoder()

function percentEncode(str: string) {
    return Array.from(UTF8_ENCODER.encode(str)).map(i => '%' + i.toString(16).toUpperCase().padStart(2, '0')).join('')
}

export type UriParams = Record<string, UrlParamValue>

export type UriMatch<P extends UriParams> = {
    score: number
    params: P
}

/*

> new URL('https://demo.software.limo/schedule/2020-01-11?foo=bar&baz=bux#quip')
URL {
  href: 'https://demo.software.limo/schedule/2020-01-11?foo=bar&baz=bux#quip',
  origin: 'https://demo.software.limo',
  protocol: 'https:',
  username: '',
  password: '',
  host: 'demo.software.limo',
  hostname: 'demo.software.limo',
  port: '',
  pathname: '/schedule/2020-01-11',
  search: '?foo=bar&baz=bux',
  searchParams: URLSearchParams { 'foo' => 'bar', 'baz' => 'bux' },
  hash: '#quip'
}

 */
