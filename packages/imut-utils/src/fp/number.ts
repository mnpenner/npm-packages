import type { nil } from '../types'
import { add as _add, div as _div, mult as _mult, sub as _sub } from '../imp/number'

/**
 * Adds a value to a number. Defaults to 0 if undefined.
 */
export function add(value: number) {
  return (prev: number | nil) => _add(prev, value)
}

/**
 * Subtracts a value from a number. Defaults to 0 if undefined.
 */
export function sub(value: number) {
  return (prev: number | nil) => _sub(prev, value)
}

/**
 * Multiplies a number by a value. Defaults to 0 if undefined.
 */
export function mult(value: number) {
  return (prev: number | nil) => _mult(prev, value)
}

/**
 * Divides a number by a value. Defaults to 0 if undefined.
 */
export function div(value: number) {
  return (prev: number | nil) => _div(prev, value)
}
