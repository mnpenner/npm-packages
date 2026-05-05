import type { nil } from '../types'

/**
 * Adds 2 numbers. `prev` defaults to 0 if undefined.
 */
export function add(a: number | nil, b: number) {
  return (a ?? 0) + b
}

/**
 * Subtracts 2 numbers. `a` defaults to 0 if undefined.
 */
export function sub(a: number | nil, b: number) {
  return (a ?? 0) - b
}

/**
 * Multiplies 2 numbers. `a` defaults to 0 if undefined.
 */
export function mult(a: number | nil, b: number) {
  return (a ?? 0) * b
}

/**
 * Divides 2 numbers. `a` defaults to 0 if undefined.
 */
export function div(a: number | nil, b: number) {
  return (a ?? 0) / b
}
