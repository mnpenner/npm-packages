import {nil} from './types'


export function add(prev: number|nil, value:number) {
    return (prev??0) + value
}

export function fpAdd<T>(value: number) {
    return (prev: number|nil) => (prev??0) + value
}

export function mult(prev: number|nil, value:number) {
    return (prev??0) * value
}

export function fpMult<T>(value: number) {
    return (prev: number|nil) => (prev??0) * value
}

export function div(prev: number|nil, value:number) {
    return (prev??0) / value
}

export function fpDiv<T>(value: number) {
    return (prev: number|nil) => (prev??0) / value
}
