import {Resolvable, resolveValue} from './resolvable'

function makeKey(opt: AnyOption, idx: number): string {
    if(opt.uniqueKey != null) {
        return resolveValue(opt.uniqueKey, opt, idx)
    }
    if(typeof opt.value === 'string') {
        return opt.value
    }
    if(typeof opt.value === 'number') {
        return String(opt.value)
    }
    try {
        const str = JSON.stringify(opt.value)
        if(str !== undefined) return str
    } catch(_){
        // ignore
    }
    return String(idx)
}

interface AnyOption {
    uniqueKey?: Resolvable<any, [AnyOption, number]>
    value: any
}

/**
 * Produces unique React Keys from an option.
 */
export class KeyFixer {
    usedKeys = new Map<string, number>

    fix(opt: AnyOption, idx: number): string {
        let fixedKey = makeKey(opt, idx)
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
