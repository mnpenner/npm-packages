// https://github.com/jorgebucaran/classcat/blob/b4aa45aae2f026071164981dd065efc42e805023/index.js
// https://github.com/lukeed/clsx/blob/925494cf31bcd97d3337aacd34e659e80cae7fe2/src/index.js
export type ClassValue = string | number | boolean | null | undefined | ClassArray | ClassObject
export interface ClassArray extends Array<ClassValue> {}
export type ClassObject = Record<string, any>

function appendClass(out: string, value: ClassValue): string {
    if(typeof value === "string") {
        return value === "" ? out : out + (out && " ") + value
    }

    if(typeof value === "number") {
        return out + (out && " ") + value
    }

    if(value == null || typeof value === "boolean") return out

    if(Array.isArray(value)) {
        for(let i = 0; i < value.length; ++i) {
            out = appendClass(out, value[i])
        }

        return out
    }

    for(const key in value) {
        if(!Object.hasOwn(value, key)) continue

        const enabled = value[key]
        if(enabled) out += (out && " ") + key
    }

    return out
}

function arrayToClass(values: ClassArray): string {
    let out = ""

    for(let i = 0; i < values.length; ++i) {
        out = appendClass(out, values[i])
    }

    return out
}

export function cc(...names: ClassValue[]): string {
    return arrayToClass(names)
}

export default cc
