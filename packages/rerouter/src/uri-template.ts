import {inspect} from "util";
import {unlinkSync} from "fs";

// https://tools.ietf.org/html/rfc6570#section-3.2.1

const PREFIX_RE = /^[+#./;?&]/;
const MODIFIER_RE = /:(?<length>\d+)|(?<repeat>\*)$/ /* FIXME: If it is an explode ("*"), scan the next character.  If it is a
      prefix (":"), continue scanning the next one to four characters
      for the max-length represented as a decimal integer and then, if
      it is still not the end of the expression, scan the next
      character. */

const RESERVED = new Set([':','/','?','#','[',']','@','!','$','&',"'",'(',')','*','+',',',';','='])
const UNRESERVED = new Set('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._~')
const UR_SET = new Set([...RESERVED,...UNRESERVED]);

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

const Escaper: Record<string,Set<string>> = {
    '': UNRESERVED,
    '+': UR_SET,
    '.': UNRESERVED,
    '/': UNRESERVED,
    ';': UNRESERVED,
    '?': UNRESERVED,
    '&': UNRESERVED,
    '#': UR_SET,
}


export default class UriTemplate {

    placeholders: Placeholder[]
    parts: TemplateParts

    constructor(template: string) {
        this.placeholders = [];
        this.parts = []

        let pos = 0;
        const matches = Array.from(template.matchAll(/\{(.+?)\}/g));
        for(const m of matches) {
            if(m.index > pos) {
                this.parts.push({
                    type: STR,
                    value: template.slice(pos,m.index)
                })
            }
            pos = m.index + m[0].length;
            const ph: Placeholder = {
                type: VAR,
                prefix: '',
                vars: [],
            }
            this.parts.push(ph);
            let varStr = m[1];
            const prefix = varStr.match(PREFIX_RE);
            if(prefix) {
                varStr = varStr.slice(1);
                ph.prefix = prefix[0];
            }
            const vars = varStr.split(',');
            for(const v of vars) {
                const item: VarSpec = {
                    name: v,
                    length: null,
                    repeat: false,
                }
                const mod = v.match(MODIFIER_RE);
                if(mod) {
                    if(mod.groups!.repeat !== undefined) {
                        item.repeat = true;
                    }
                    if(mod.groups!.length !== undefined) {
                        item.length = Number(mod.groups!.length);
                    }
                    item.name = item.name.slice(0,mod.index);
                }
                ph.vars.push(item);
            }
        }
        if(pos < template.length) {
            this.parts.push({
                type: STR,
                value: template.slice(pos)
            })
        }
        // TODO: default values https://docs.microsoft.com/en-us/dotnet/framework/wcf/feature-details/uritemplate-and-uritemplatetable
        // TODO: regex or int conditionals
        // log(matches,template,this.placeholders);
        // log(this.parts);
        // process.exit(0);


    }

    expand(variables: Record<string,UrlParamValue>): string {
        const out = [];
        for(const p of this.parts) {
            switch(p.type) {
                case VAR:
                    const vs: string[] = [];
                    out.push(FirstMap[p.prefix]);
                    for(const v of p.vars) {
                        if(Object.prototype.hasOwnProperty.call(variables,v.name)) {
                            const x = variables[v.name];
                            const esc = (x:any) => percentEncodeNotIn(x, Escaper[p.prefix], v.length);
                            let pre = '';
                            if(Named[p.prefix]) {
                                pre = v.name + (isEmpty(x) ? IfEmp[p.prefix] : '=');
                            }
                            if(isEmpty(x)) {
                                vs.push(pre);
                            } else if(Array.isArray(x)) {
                                vs.push((v.repeat ? '' : pre) + (x as any[]).map(z => (v.repeat ? pre : '') + esc(z)).join(v.repeat ? SeparatorMap[p.prefix] : ','));
                            } else if(typeof x === 'object') {
                                vs.push((v.repeat ? '' : pre) + Object.entries(x).map(([ok,ov]) => `${esc(ok)}${v.repeat ? '=' : ','}${esc(ov)}`).join(v.repeat ? SeparatorMap[p.prefix] : ','))
                            } else {
                                vs.push(pre + esc(x));
                            }
                        }
                    }
                    out.push(vs.join(SeparatorMap[p.prefix]));
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
    }
}

function isEmpty(x: any) {
    return x == null || x === '' || (Array.isArray(x) ? !x.length : (typeof x === 'object' && !Object.keys(x).length))
}

type UrlParamValue = string|number|string[]|number[]|Record<string,string|number>;


function percentEncodeNotIn(x:string|number|boolean|null, set: Set<string>, length: number|null) {
    if(typeof x === 'number') {
        return String(x);
    }
    if(x === true) return '1';
    if(x === false) return '0';
    if(x === null) return '';

    if(length != null) {
        x = x.slice(0,length);
    }

    return Array.from(x).map(ch => {
        if(set.has(ch)) {
            return ch;

        }
        return percentEncode(ch);
    }).join('');
}


function encodeU(x: string|number) {
    return percentEncodeNotIn(x,UNRESERVED);
}


function percentEncode(ch: string) {
    return '%' + ch.codePointAt(0)!.toString(16).toUpperCase().padStart(2,'0');
}

function encodeUR(x: string|number) {
    if(typeof x === 'number') return String(x);

    // TODO: don't re-escape %-encoded values.
    return percentEncodeNotIn(x,UR_SET);
}

interface Match {
    score: number
    params: Record<string,UrlParamValue>
}


function log(...vars: any) {
    console.log(vars.map((v:any) => inspect(v, {colors:true,depth:4,showProxy:true,breakLength:120,maxArrayLength:10})).join('  '));
}
