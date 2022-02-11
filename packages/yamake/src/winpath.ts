import fs from 'fs/promises'
import Path from 'path'
import {access, escapeRegExp, promiseMap} from './util'

const envPathArray = process.env.PATH ? process.env.PATH.split(';') : []  // FIXME: this isn't technically correct: https://stackoverflow.com/questions/5114985/echo-path-on-separate-lines#comment5746924_5115119
const envPathExtArray = process.env.PATHEXT ? process.env.PATHEXT.toLowerCase().split(';') : []
const envPathExtRegex = envPathExtArray.length ? new RegExp('\\.(?:' + envPathExtArray.map(e => escapeRegExp(e.replace(/^\./, ''))).join('|') + ')$', 'iu') : /x^/

// console.log(pathRegex)


async function buildExeMap() {
    const dirMap = await promiseMap(envPathArray, d => fs.readdir(d).catch(() => []))
    const pathMap = new Map<string, string>()
    for(const dir of envPathArray) {
        for(const file of dirMap.get(dir)!) {
            if(envPathExtRegex.test(file)) {
                const lower = file.toLowerCase()
                if(!pathMap.has(lower)) {
                    pathMap.set(lower, Path.join(dir, file))
                }
            }
        }
    }

    return pathMap
}

let exeMap: null | Map<string, string> = null
let cache = new Map<string, string>()

export async function resolveExe(cmd: string): Promise<string> {
    const key = Path.normalize(cmd).toLowerCase()

    let resolved = cache.get(key)
    if(resolved != null) {
        return resolved
    }

    resolved = await (async () => {
        if(envPathExtRegex.test(cmd)) {
            return cmd
        }

        for(const ext of envPathExtArray) {
            const withExt = cmd + ext
            if(await access(withExt)) {
                return withExt
            }
        }

        if(!/[\/\\]/.test(cmd)) {
            if(!exeMap) exeMap = await buildExeMap()

            for(const ext of envPathExtArray) {
                const withExt = key + ext
                const resolved = exeMap.get(withExt)
                if(resolved != null) {
                    return resolved
                }
            }
        }

        return cmd
    })()

    // console.log('resolved',cmd,'->',resolved)
    cache.set(key, resolved)
    return resolved
}

