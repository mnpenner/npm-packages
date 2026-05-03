export * from './ts-expect'
export * from './assume'

/**
 * Re-maps `T` into a new object type to force TypeScript to fully evaluate it.
 *
 * - Flattens intersections (e.g. `A & B` → `{ a: ..., b: ... }` in hovers)
 * - Improves IDE display and error readability
 * - Has no effect on runtime behavior or type assignability
 */
export type Simplify<T> = { [K in keyof T]: T[K] } & {}
