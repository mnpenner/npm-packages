import {resolveValue} from './resolvable'

type StrictKey = string|number

function defaultMakeKey(opt: any, idx: number): StrictKey {
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
    usedKeys = new Map<StrictKey,number>

    fix(opt: any, idx: number): StrictKey {
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
