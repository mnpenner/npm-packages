import type { Override } from './index'
import type { ComponentProps, ComponentPropsWithoutRef, ElementType } from 'react'

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
export function assumeProps<C extends ElementType>(_val: any): asserts _val is ComponentProps<C> {
    /* no implementation */
}

/**
 * Replaces props from a React component or intrinsic element with an extension object type.
 *
 * Extension keys typed as `never` are removed from the resulting prop type.
 *
 * @example
 * ```ts
 * type LinkProps = OverrideProps<
 *     'a',
 *     { className?: ClassValue; href: never; onClick: never; to: string }
 * >
 * ```
 *
 * @template Base - The React component or intrinsic element type to derive props from.
 * @template Extension - The prop object type that replaces matching base props and removes `never` props.
 */
export type OverrideProps<Base extends ElementType, Extension> = Override<
    ComponentPropsWithoutRef<Base>,
    Extension
>
