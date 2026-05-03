import { cc } from '@mpen/classcat'

export interface ClassArray extends Array<ClassValue> {}

export type ClassValue = string | number | ClassDictionary | ClassArray | undefined | null | false

export interface ClassDictionary {
    [id: string]: boolean | undefined | null
}

// export interface IDict<TValue> {
//     [key: string]: TValue // TS1023 prevents us from allowing arbitrary keys (symbols)
// }

export interface IAttrs {
    className?: ClassValue
    style?: { [prop: string]: string | number }
    ref?: RefCallback
    // TODO: fill with exhaustive list of attributes to assist the IDE
    [other: string]: any
}

export type RefCallback = (n: Element) => void
type AttributeCallback = (...args: any[]) => unknown

function mergeAttrs(...attrDicts: IAttrs[]): IAttrs {
    if (attrDicts.length === 0) {
        return {}
    }
    const eventHandlers: { [attr: string]: AttributeCallback[] } = {}
    const classes = []
    const merged = attrDicts[0]

    for (const k of Object.keys(merged)) {
        if (merged[k] === undefined) {
            delete merged[k]
        }
    }

    for (const attrs of attrDicts) {
        for (const attr of Object.keys(attrs)) {
            const value = attrs[attr]

            if (value === undefined) {
                //
            } else if (value === mergeAttrs.DELETE) {
                delete merged[attr]
            } else if (value === mergeAttrs.UNDEFINED) {
                merged[attr] = undefined
            } else if (attr === 'style') {
                merged[attr] = Object.assign({}, merged[attr], value)
            } else if (attr === 'className') {
                classes.push(value)
            } else if (attr === 'ref' || /^on[A-Z]/.test(attr)) {
                ;(eventHandlers[attr] || (eventHandlers[attr] = [])).push(value)
            } else {
                merged[attr] = value
            }
        }
    }

    if (classes.length) {
        merged.className = cc(classes)
    }

    for (const attr of Object.keys(eventHandlers)) {
        const funcs = eventHandlers[attr]

        if (funcs.length === 1) {
            merged[attr] = funcs[0]
        } else {
            merged[attr] = (...args: any[]) => {
                let result = undefined
                for (const func of funcs) {
                    const params: any[] = result === undefined ? args : [...args, result]
                    result = func(...params)
                }
                return result
            }
        }
    }

    return merged
}

namespace mergeAttrs {
    export const DELETE = Symbol('delete')
    export const UNDEFINED = Symbol('undefined')
}

export default mergeAttrs
