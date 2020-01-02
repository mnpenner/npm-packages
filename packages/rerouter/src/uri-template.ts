import {inspect, TextEncoder} from "util";
import {unlinkSync} from "fs";
import log from './log';

// https://tools.ietf.org/html/rfc6570#section-3.2.1

const PREFIX_RE = /^[+#./;?&]/;
const MODIFIER_RE = /(?<repeat>\*)?(?::(?<func>[a-zA-Z][a-zA-Z0-9_]*))?(?::(?:(?<length>\d+)))?$/ /* FIXME: If it is an explode ("*"), scan the next character.  If it is a
      prefix (":"), continue scanning the next one to four characters
      for the max-length represented as a decimal integer and then, if
      it is still not the end of the expression, scan the next
      character. */

const UNRESERVED = /[^a-zA-Z0-9\-._~]+/g;
const UR_SET = /[^a-zA-Z0-9\-._~:\/?#[\]@!$&'()*+,;=]+/g;

const STR = Symbol('string')
const VAR = Symbol('var');

interface Placeholder {
    type: typeof VAR
    prefix: string
    vars: VarSpec[]
}

interface StringLiteral {
    type: typeof STR
    value: string
}

type TemplateParts = Array<Placeholder|StringLiteral>

interface VarSpec {
    name: string
    length: number|null
    func: string|null
    repeat: boolean
}

const SeparatorMap: Record<string,string> = {
    '': ',',
    '+': ',',
    '.': '.',
    '/': '/',
    ';': ';',
    '?': '&',
    '&': '&',
    '#': ',',
}
const FirstMap: Record<string,string> = {
    '': '',
    '+': '',
    '.': '.',
    '/': '/',
    ';': ';',
    '?': '?',
    '&': '&',
    '#': '#',
}

const Named: Record<string,boolean> = {
    '': false,
    '+': false,
    '.': false,
    '/': false,
    ';': true,
    '?': true,
    '&': true,
    '#': false,
}

const IfEmp: Record<string,string> = {
    '': '',
    '+': '',
    '.': '',
    '/': '',
    ';': '',
    '?': '=',
    '&': '=',
    '#': '',
}

const EscapeRegexes: Record<string,RegExp> = {
    '': UNRESERVED,
    '+': UR_SET,
    '.': UNRESERVED,
    '/': UNRESERVED,
    ';': UNRESERVED,
    '?': UNRESERVED,
    '&': UNRESERVED,
    '#': UR_SET,
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




export default class UriTemplate {

    expandParts: TemplateParts
    matchRegex: RegExp
    matchMap: Map<string,MapItem>

    constructor(template: string) {
        this.expandParts = []
        const re: string[] = ['^'];
        this.matchMap = new Map();

        let pos = 0;
        const matches = Array.from(template.matchAll(/\{(.+?)\}/g)) as Required<RegExpMatchArray>[];
        let matchCounter = 0;

        for(const m of matches) {
            if(m.index! > pos) {
                const lit = template.slice(pos,m.index);
                this.expandParts.push({
                    type: STR,
                    value: lit
                })
                const groupName = `static__${matchCounter++}`
                re.push(`(?<${groupName}>${escapeRegExp(lit)})`)
                this.matchMap.set(groupName,{type:VarType.STATIC})
            }
            pos = m.index! + m[0].length;
            const ph: Placeholder = {
                type: VAR,
                prefix: '',
                vars: [],
            }
            this.expandParts.push(ph);
            let varStr = m[1];
            const prefix = varStr.match(PREFIX_RE);
            if(prefix) {
                varStr = varStr.slice(1);
                ph.prefix = prefix[0];
            }
            const vars = varStr.split(',');


            const isNamed = Named[ph.prefix];
            let isFirst = true;

            if(!isNamed) {
                re.push(escapeRegExp(FirstMap[ph.prefix]));
            }

            for(const v of vars) {
                const item: VarSpec = {
                    name: v,
                    length: null,
                    func: null,
                    repeat: false,
                }

                const mod = v.match(MODIFIER_RE) as Required<RegExpMatchArray>|null;
                if(mod) {
                    if(mod.groups!.repeat !== undefined) {
                        item.repeat = true;
                    }
                    if(mod.groups!.length !== undefined) {
                        item.length = Number(mod.groups!.length);
                    }
                    if(mod.groups!.func !== undefined) {
                        item.func = mod.groups.func;
                    }
                    item.name = item.name.slice(0,mod.index);
                }
                ph.vars.push(item);




                if(!isNamed) {
                    if(!isFirst) {
                        re.push(escapeRegExp(SeparatorMap[ph.prefix]));
                    }

                    const groupName = item.name
                    re.push(`(?<${groupName}>`)
                    if (item.func != null) {
                        switch (item.func) {
                            case 'int':
                                re.push('-?\\d')
                                break;
                            default:
                                throw new Error(`Unrecognized UriTemplate func: ${item.func}`);
                        }
                    } else if (ph.prefix === '+') {
                        re.push('[^?#]')
                    } else if (ph.prefix === '#') {
                        re.push('.')
                    } else {
                        re.push('[^/?#]')
                    }
                    if (item.length != null) {
                        re.push(`{${item.length}}`);
                    } else {
                        re.push('+?')
                    }

                    re.push(')')
                    this.matchMap.set(groupName, {var: item, type:VarType.DYNAMIC, prefix: ph.prefix});
                }

                isFirst = false;
            }

            if(isNamed) {
                re.push('(?:',escapeRegExp(FirstMap[ph.prefix]));
                const groupName = `kwargs__${matchCounter++}`
                re.push(`(?<${groupName}>[^/?#]*)`)
                re.push(')?')
                this.matchMap.set(groupName, {vars:ph.vars, type:VarType.NAMED, prefix: ph.prefix});
            }


        }
        if(pos < template.length) {
            const lit = template.slice(pos);
            this.expandParts.push({
                type: STR,
                value: lit
            })
            const groupName = `static__${matchCounter++}`
            re.push(`(?<${groupName}>${escapeRegExp(lit)})`)
            this.matchMap.set(groupName,{type:VarType.STATIC})
        }
        // TODO: default values https://docs.microsoft.com/en-us/dotnet/framework/wcf/feature-details/uritemplate-and-uritemplatetable
        // TODO: regex or int conditionals
        // log(matches,template,this.placeholders);
        // log(this.parts);
        // process.exit(0);

        re.push('$')
        this.matchRegex = new RegExp(re.join(''));
    }

    expand(variables: Record<string,UrlParamValue>): string {
        const out = [];
        for(const p of this.expandParts) {
            switch(p.type) {
                case VAR:
                    const vs: string[] = [];
                    for(const v of p.vars) {
                        if(Object.prototype.hasOwnProperty.call(variables,v.name)) {
                            const x = variables[v.name];
                            const esc = (x:any) => percentEncodeRegExp(x, EscapeRegexes[p.prefix], v.length);
                            let pre = '';
                            if(Named[p.prefix]) {
                                pre = v.name + (isEmpty(x) ? IfEmp[p.prefix] : '=');
                            }
                            if(Array.isArray(x)) {
                                if(x.length) {
                                    vs.push((v.repeat ? '' : pre) + (x as any[]).map(z => (v.repeat ? pre : '') + esc(z)).join(v.repeat ? SeparatorMap[p.prefix] : ','));
                                }
                            } else if(typeof x === 'object') {
                                if(Object.keys(x).length) {
                                    vs.push((v.repeat ? '' : pre) + Object.entries(x).map(([ok, ov]) => `${esc(ok)}${v.repeat ? '=' : ','}${esc(ov)}`).join(v.repeat ? SeparatorMap[p.prefix] : ','))
                                }
                            } else {
                                vs.push(pre + esc(x));
                            }
                        }
                    }
                    if(vs.length) {
                        out.push(FirstMap[p.prefix], vs.join(SeparatorMap[p.prefix]));
                    }
                    break;
                case STR:
                    out.push(p.value);
                    break;
            }
        }
        return out.join('');
    }

    match(url: string): Match|null {
        // https://reach.tech/router/ranking

        let score = 0;
        const m = url.match(this.matchRegex);
        console.log(`${JSON.stringify(url)}.match(${this.matchRegex})`);
        if(m !== null) {
            // log('m',m);
            let params: Array<[string,NullableUrlParamValue]> = []
            if(m.groups != null) {
                // log('m.groups',m.groups)
                for(const [k,v] of Object.entries(m.groups)) {
                    const varSpec = this.matchMap.get(k)!;
                    let value: UrlParamValue|null;

                    switch(varSpec.type) {
                        case VarType.NAMED: {
                            const parsed = parseParams(v, SeparatorMap[varSpec.prefix])
                            log('parsed',parsed);

                            for(const vs of varSpec.vars) {
                                if(vs.repeat) {
                                    score -= 1;
                                    params.push([vs.name, parsed]) // TODO: add int and length support
                                    break;
                                } else {
                                    score += 2;
                                    params.push([vs.name, parsed[vs.name]])
                                    delete parsed[vs.name];
                                }
                            }
                        }break;
                        case VarType.DYNAMIC: {
                            score += 2;
                            if (v == null) {
                                if (varSpec.var.repeat) {
                                    if (Named[varSpec.prefix]) {
                                        value = EMPTY_OBJ;
                                    } else {
                                        value = EMPTY_ARR as any;
                                    }
                                } else {
                                    value = null;
                                }
                            } else {
                                value = decodeURIComponent(v);
                                if (varSpec.var.length != null) {
                                    value = value.slice(0, varSpec.var.length);
                                }
                                if (varSpec.var.func === 'int') {
                                    value = Number(value);
                                }
                            }
                            params.push([varSpec.var.name,value])
                        }break;
                        case VarType.STATIC: {
                            score += 3;
                        }break;
                    }
                }
            }
            return {
                score,
                params: Object.fromEntries(params),
            }
        }
        return null;
    }
}

function parseParams(queryString: string, separator: string): Record<string,string|null> {
    const pairs = queryString.split(separator);
    return Object.fromEntries(pairs.map(pair => {
        const idx = pair.indexOf('=');
        if(idx === -1) {
            return [pair,null];
        }
        const key = pair.slice(0,idx);
        const value = pair.slice(idx+1);
        return [key,decodeURIComponent(value)];
    }))
}

const EMPTY_OBJ = Object.freeze(Object.create(null));
const EMPTY_ARR = Object.freeze([]);

function isEmpty(x: any) {
    return x == null || x === '' || (Array.isArray(x) ? !x.length : (typeof x === 'object' && !Object.keys(x).length))
}

type UrlParamValue = string|number|string[]|number[]|Record<string,string|number|null>;
type NullableUrlParamValue = UrlParamValue|null;

function escapeRegExp(string: string) {
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#Escaping
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

function percentEncodeRegExp(x:string|number|boolean|null, set: RegExp, length: number|null) {
    if(typeof x === 'number') {
        return String(x);
    }
    if(x === true) return '1';
    if(x === false) return '0';
    if(x === null) return '';

    if(length != null) {
        x = x.slice(0,length);
    }

    return x.replace(set, percentEncode);
}




const UTF8_ENCODER = new TextEncoder();

function percentEncode(str: string) {
    return Array.from(UTF8_ENCODER.encode(str)).map(i => '%' + i.toString(16).toUpperCase().padStart(2,'0')).join('');
}

interface Match {
    score: number
    params: Record<string,UrlParamValue|null>
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
