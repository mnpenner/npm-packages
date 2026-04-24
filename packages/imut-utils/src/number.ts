import {nil} from './types'

/**
 * Adds 2 numbers. `prev` defaults to 0 if undefined.
 */
export function add(a: number|nil, b:number) {
    return (a??0) + b
}

export function fpAdd(value: number) {
    return (prev: number|nil) => (prev??0) + value
}

/**
 * Subtracts 2 numbers. `a` defaults to 0 if undefined.
 */
export function sub(a: number|nil, b:number) {
    return (a??0) - b
}

export function fpSub(value: number) {
    return (prev: number|nil) => (prev??0) - value
}

/**
 * Multiplies 2 numbers. `a` defaults to 0 if undefined.
 */
export function mult(a: number|nil, b:number) {
    return (a??0) * b
}

export function fpMult(value: number) {
    return (prev: number|nil) => (prev??0) * value
}

/**
 * Divides 2 numbers. `a` defaults to 0 if undefined.
 */
export function div(a: number|nil, b:number) {
    return (a??0) / b
}

export function fpDiv(value: number) {
    return (prev: number|nil) => (prev??0) / value
}
