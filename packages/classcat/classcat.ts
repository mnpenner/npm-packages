// https://github.com/jorgebucaran/classcat/blob/b4aa45aae2f026071164981dd065efc42e805023/index.js
// https://github.com/lukeed/clsx/blob/925494cf31bcd97d3337aacd34e659e80cae7fe2/src/index.js
export type ClassValue = string | number | boolean | null | undefined | ClassArray | ClassObject
export type ClassArray = ClassValue[]
export type ClassObject = Record<string, unknown>

function toClass(value: ClassValue): string {
    if(typeof value === "string") return value
    if(typeof value === "number") return String(value)
    if(value == null || typeof value === "boolean") return ""

    if(Array.isArray(value)) {
        return arrayToClass(value)
    }

    let out = ""
    for(const [key, enabled] of Object.entries(value)) {
        if(enabled) out += (out && " ") + key
    }

    return out
}

function arrayToClass(values: ClassArray): string {
    let out = ""

    for(const value of values) {
        const className = toClass(value)
        if(className !== "") {
            out += (out && " ") + className
        }
    }

    return out
}

export function cc(...names: ClassValue[]): string {
    return arrayToClass(names)
}

export default cc
