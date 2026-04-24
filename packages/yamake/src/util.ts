import crypto from 'crypto'
import fs from 'fs/promises'
import {constants as fsconst} from 'fs'
import {jsonStringify} from './index'
import type {ValueOf} from './types'

export async function promiseMap<TIn, TOut>(inputs: TIn[], fn: (x: TIn) => Promise<TOut>): Promise<Map<TIn, TOut>> {
    const m = new Map<TIn, TOut>()
    const promises = []
    for(const f of inputs) {
        promises.push(Promise.resolve(fn(f)).then(t => {
            m.set(f, t)
        }))
    }
    await Promise.all(promises)
    return m
}

export function objectHash(obj: any): string {
    return crypto.createHash('md5').update(jsonStringify(obj)).digest('base64url')
}

export function toStringArray(arg: any): string[] {
    if(arg == null) return []
    if(!Array.isArray(arg)) {
        return [String(arg)]
    }
    return arg.map(x => String(x))
}

function escapeWindowsArg(s: string) {
    return '"' + s.replace(/"/g, '"""') + '"'
    // return s.replace(/([^A-Za-z0-9._/\\:-]|^\/)/g,'^$1')
}

export function escapeShellArg(s: string) {
    if(!/^[A-Za-z0-9=._\/-]+$/.test(s)) {
        s = "'" + s.replace(/'/g, "'\\''") + "'"
        // s = s.replace(/^(?:'')+/g, '') // unduplicate single-quote at the beginning
        //     .replace(/\\'''/g, "\\'"); // remove non-escaped single-quote if there are enclosed between 2 escaped
    }
    return s
}

export async function mtime(file: string): Promise<bigint | null> {
    try {
        const stat = await fs.stat(file, {bigint: true})
        return stat.mtimeNs
    } catch(err: any) {
        if(err.code === 'ENOENT') {
            return null
        }
        throw err
    }
    // console.log(stat)

}

export function max<T>(args: Array<T>): T {
    if(!args.length) throw new Error("Missing args")
    let m = args[0]
    for(let i = 1; i < args.length; ++i) {
        if(args[i] > m) {
            m = args[i]
        }
    }
    return m
}

export function min<T>(args: Array<T>): T {
    if(!args.length) throw new Error("Missing args")
    let m = args[0]
    for(let i = 1; i < args.length; ++i) {
        if(args[i] < m) {
            m = args[i]
        }
    }
    return m
}

export async function access(path: string, mode: ValueOf<typeof fsconst>=fsconst.F_OK) {
    try {
        await fs.access(path, mode)
        return true
    } catch(_) {
        return false
    }
}

async function getLastModTime(files: string[]): Promise<bigint | null> {
    const times = await Promise.all(files.map(f => mtime(f)))
    if(times.includes(null)) {
        return null
    }
    return max(times)
}

function isNotNull<T>(x: T | null): x is T {
    return x != null
}

export function escapeRegExp(string: string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')  // $& means the whole matched string
}

export function doesNotContainNull<T>(arr: Array<T | null>): arr is Array<T> {
    return arr.every(x => x != null)
}

export async function getValidMtimesArr(files: string[]): Promise<Array<bigint>> {
    return (await getMtimesArr(files)).filter(isNotNull)
}

async function getMtimesArr(files: string[]): Promise<Array<bigint | null>> {
    if(!files?.length) return []
    return Promise.all(files.map(f => mtime(f)))
}

async function getMtimes(files: string[]): Promise<Map<string, bigint | null>> {
    return promiseMap(files, mtime)
}

export function filterMap<K, V>(map: Map<K, V>, fn: (v: V, k: K) => boolean): [K, V][] {
    return Array.from(map).filter(([k, v]) => fn(v, k))
}

export function nsToMs(ns: bigint): number {
    return Number(ns / 1000n) / 1000
}

export function msToNs(ms: number): bigint {
    return BigInt(Math.floor(ms)) * 1000000n
}

export function memo1<T,U>(fn: (x:T)=>U) {
    const cache = new Map<T,U>()
    return function memoized(x:T) {
        if(cache.has(x)) {
            return cache.get(x)
        }
        const v = fn(x)
        cache.set(x,v)
        return v
    }
}

export function camel2kebab(str: string): string {
    return str.replace(/([a-z])([A-Z]+)/g, (_,a,b) => {
        return a + '-' + b.toLowerCase()
    })
}
