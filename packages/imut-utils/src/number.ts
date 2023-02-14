import {nil} from './types'


export function add(prev: number|nil, value:number) {
    return (prev??0) + value
}

export function fpAdd(value: number) {
    return (prev: number|nil) => (prev??0) + value
}

export function mult(prev: number|nil, value:number) {
    return (prev??0) * value
}

export function fpMult(value: number) {
    return (prev: number|nil) => (prev??0) * value
}

export function div(prev: number|nil, value:number) {
    return (prev??0) / value
}

export function fpDiv(value: number) {
    return (prev: number|nil) => (prev??0) / value
}
