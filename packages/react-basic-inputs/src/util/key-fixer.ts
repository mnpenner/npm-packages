import {Key} from 'react'
import {resolveValue} from './resolvable'


function defaultMakeKey(opt: any, idx: number): Key {
    if(opt.key != null) {
        return resolveValue(opt.key, opt, idx)
    } else if(typeof opt.value === 'string' || typeof opt.value === 'number') {
        return opt.value
    }
    return idx
}

/**
 * Produces unique React Keys from an option.
 */
export class KeyFixer {
    usedKeys = new Map<Key,number>

    fix(opt: any, idx: number): Key {
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
