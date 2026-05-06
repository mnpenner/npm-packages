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

/**
 * Replaces keys from a base object type with an extension object type.
 *
 * Extension keys typed as `never` are removed from the resulting type.
 *
 * @example
 * ```ts
 * type Props = Override<
 *     { className?: string; href?: string },
 *     { className?: ClassValue; href: never; to: string }
 * >
 * ```
 *
 * @template Base - The object type to override.
 * @template Extension - The object type that replaces matching base keys and removes `never` keys.
 */
export type Override<Base, Extension> = Omit<Base, keyof Extension> & OmitNever<Extension>

type NeverKeys<T> = {
    [K in keyof T]-?: [T[K]] extends [never] ? K : never
}[keyof T]

type OmitNever<T> = Omit<T, NeverKeys<T>>
