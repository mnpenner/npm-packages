import {Resolvable, resolveValue} from './resolvable'

function makeKey<T>(opt: AnyOption<T>, idx: number): string {
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

export interface AnyOption<T=any> {
    uniqueKey?: Resolvable<string, [AnyOption<T>, number]>
    value: T
}

/**
 * Produces unique React Keys from an option.
 */
export class KeyFixer<T=any> {
    private _usedKeys = new Map<string, number>

    fix(opt: AnyOption<T>, idx: number): string {
        let fixedKey = makeKey(opt, idx)
        for(; ;) {
            let suffix = this._usedKeys.get(fixedKey)
            if(suffix === undefined) {
                this._usedKeys.set(fixedKey, 1)
                break
            }
            this._usedKeys.set(fixedKey, ++suffix)
            fixedKey = `${fixedKey}(${suffix})`
        }
        return fixedKey
    }
}
