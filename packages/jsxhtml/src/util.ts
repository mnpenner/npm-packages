import {isFunction, isIterable} from '@mpen/is-type'
import type {FlatString, JsxChildren, JsxComponent} from './jsx-types'
import {isJsxNode} from './jsx-node'
import cssEscape from './css-escape'
import jsSerialize from 'js-serialize'


export function mapIter<In, Out>(iterable: Iterable<In>, cb: (el: In, i: number) => Out): Out[] {
    const out = []
    let i = 0
    for(const x of iterable) {
        out.push(cb(x, i++))
    }
    return out
}

export function getStringTag(value: any): string {
    // https://github.com/lodash/lodash/blob/2da024c3b4f9947a48517639de7560457cd4ec6c/.internal/getTag.js
    if(value == null) {
        return value === undefined ? 'Undefined' : 'Null'
    }
    return Object.prototype.toString.call(value).slice(8, -1)
}

export function isEmptyChildren(children: JsxChildren): boolean {
    return children == null || (Array.isArray(children) && children.length === 0)
}

export function isEmptyRender(el: any): boolean {
    return el == null || el === false
}

export function fullWide(n: number): string {
    try {
        return n.toLocaleString('en-US', {useGrouping: false, maximumFractionDigits: 20})
    } catch {
        return n.toFixed(14).replace(/\.?0+$/, '')
    }
}


export function flattenString(content: FlatString, sep = '') {
    return isIterable(content) ? Array.from(content).join(sep) : String(content)
}

export function scriptChild(el: any): string {
    if(typeof el === 'string') {
        return el
    }
    if(isEmptyRender(el)) {
        return ''
    }
    if(isJsxNode(el)) {
        throw new Error(`<script> cannot contain JSX nodes.`)
        // return el.toString()
    }
    // if(isHtmlSafe(el)) {
    //     return el.__html  // TODO: do we still need this now that we have <RawHtml> ?
    // }
    return jsSerialize(el)
}

export function styleChild(el: any): string {
    if(typeof el === 'string') {
        return el
    }
    if(isEmptyRender(el)) {
        return ''
    }
    if(isJsxNode(el)) {
        throw new Error(`<style> cannot contain JSX nodes.`)
        // return el.toString()
    }
    return cssEscape(String(el))
}


export function flattenChildren(children: any|any[], callback: (el:any)=>string): string {
    return Array.isArray(children) ? children.map(callback).join('') : callback(children)
}

export const isJsxComponent = isFunction as ((x: any) => x is JsxComponent)
