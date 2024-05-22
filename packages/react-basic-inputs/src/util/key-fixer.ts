import {Resolvable, resolveValue} from './resolvable'
import type {Key} from 'react'

export type StrictKey = string|number

function defaultMakeKey(opt: AnyOption, idx: number): StrictKey {
    if(opt.key != null) {
        return resolveValue(opt.key, opt, idx)
    } else if(typeof opt.value === 'string' || typeof opt.value === 'number') {
        return opt.value
    }
    return idx
}

interface AnyOption {
    key?: Resolvable<any, [AnyOption, number]>
    value: any
}

/**
 * Produces unique React Keys from an option.
 */
export class KeyFixer {
    usedKeys = new Map<StrictKey, number>

    fix(opt: AnyOption, idx: number): StrictKey {
        let fixedKey = defaultMakeKey(opt, idx)
        for(; ;) {
            let suffix = this.usedKeys.get(fixedKey)
            if(suffix === undefined) {
                this.usedKeys.set(fixedKey, 1)
                break
            }
            this.usedKeys.set(fixedKey, ++suffix)
            fixedKey = `${fixedKey}(${suffix})`
        }
        return fixedKey
    }
}
