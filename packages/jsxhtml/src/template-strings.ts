import jsSerialize from 'js-serialize'
import {escapeScript} from './escape'

// TODO: write css`` or style`` string that escapes with CSS.escape
// js`` or script`` that escapes with JSON.stringify
// attr`` that escapes for HTML attributes
// html``
// url`` escapeUriComponent

export class JsFrag {
    constructor(private readonly str: string) {
    }

    toString() {
        return this.str
    }
}

function escapeJs(obj: any) {
    if(obj instanceof JsFrag) {
        return obj
    }
    return jsSerialize(obj)
}

export function js(strings: TemplateStringsArray, ...values: any[]) {
    return new JsFrag(escapeScript(strings.reduce((out, str, i) =>
        out + str + (i < values.length ? escapeJs(values[i]) : ''), '')))
}
