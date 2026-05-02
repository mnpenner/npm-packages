import type {ComponentProps, ElementType} from 'react'

/**
 * Casts a value to the props of a given React component or element type.
 *
 * See also [`assumeType`]{@link assumeType}.
 *
 * @example
 * ```ts
 * assumeProps<'div'>(props);
 * return <div {...props} />;
 * ```
 *
 * @param _val - The value to assert the type of.
 * @template C - The React component or element type.
 */
export function assumeProps<C extends ElementType>(_val: any): asserts _val is ComponentProps<C> { /* no implementation */ }
