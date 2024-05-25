import {AnyObject} from '../types/utility'

const TYPE_KEY = '__js$type'
import {isPojo} from '@mpen/is-type'

const enum TypeKey {
    Set,
    Map,
    Date,
    BigInt,
    Table,
}

function jsonReplacer(this: any, key: string, _value: any): any {
    // value arg is not the same as this[key]. value is pre-transformed and doesn't work for dates.
    // https://stackoverflow.com/questions/31096130/how-to-json-stringify-a-javascript-date-and-preserve-timezone#comment121087544_54037861
    const value = this[key]
    if(value instanceof Set) {
        return {[TYPE_KEY]: TypeKey.Set, value: Array.from(value)}
    }
    if(value instanceof Map) {
        return {[TYPE_KEY]: TypeKey.Map, value: Array.from(value)}
    }
    if(value instanceof Date) {
        return {[TYPE_KEY]: TypeKey.Date, value: value.valueOf()}
    }
    if(typeof value === 'bigint') {
        return String(value)+'n'
        // if(value < Number.MIN_SAFE_INTEGER || value > Number.MAX_SAFE_INTEGER) {
        //     return {[TYPE_KEY]: TypeKey.BigInt, value: String(value)}
        // }
        // return Number(value)
    }
    if(Array.isArray(value) && value.length >= 2 && isPojo(value[0])) {
        const keys = Object.keys(value[0])
        if(value.every(o => isPojo(o) && eqArray(keys, Object.keys(o)))) {
            return {
                [TYPE_KEY]: TypeKey.Table,
                keys,
                values: value.map(v => Object.values(v)),
            }
        }
    }
    // TODO: fix symbols, if we care: https://stackoverflow.com/a/56928839/65387
    // if(value instanceof Symbol) {
    //     return {[TYPE_KEY]: 'Symbol', value: value.description}
    // }
    // if(value === undefined) {
    //     return {[TYPE_KEY]: 'undefined'}
    // }
    return value
}

function eqArray(a: any[], b: any[]): boolean {
    if(a.length !== b.length) return false
    for(let i=0; i<a.length; ++i) {
        if(!Object.is(a[i], b[i])) return false
    }
    return true
}

function jsonReviver(this: any, _key: string, value: any): any {
    if(value != null && typeof value === 'object' && Object.hasOwn(value, TYPE_KEY)) {
        switch(value[TYPE_KEY]) {
            case TypeKey.Map:
                return new Map(value.value)
            case TypeKey.Set:
                return new Set(value.value)
            case TypeKey.Date:
                return new Date(value.value)
            case TypeKey.BigInt:
                return BigInt(value.value)
            case TypeKey.Table:
                return value.values.map((row: AnyObject) => {
                    const obj = Object.create(null)
                    for(let i=0; i<value.keys.length; ++i) {
                        obj[value.keys[i]] = row[i]
                    }
                    return obj
                })
            // case 'Symbol':
            //     return Symbol.for(value.value)
            // case 'undefined':
            //     return undefined
            default:
                throw new Error(`Unhandled ${TYPE_KEY}: ${value[TYPE_KEY]}`)
        }
    }
    return value
}

export function jsonStringify(obj: any, space?: string | number): string {
    return JSON.stringify(obj, jsonReplacer, space)
}

export function jsonParse(json: string): any {
    return JSON.parse(json, jsonReviver)
}
