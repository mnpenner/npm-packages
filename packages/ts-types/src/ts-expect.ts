/*!
 * Portions derived from ts-expect:
 * https://github.com/TypeStrong/ts-expect/blob/e4c63787e1f3511abd83b92503d0d34cf2ebdcc8/src/index.ts
 *
 * MIT License
 * Copyright (c) 2019 Blake Embrey (hello@blakeembrey.com)
 */

/**
 * Checks that `Value` is assignable to `Target`.
 *
 * @example
 * ```ts
 * expectType<TypeOf<number, 123>>(true);
 * expectType<TypeOf<123, number>>(false);
 * ```
 *
 * See also [`expectType`]{@link expectType}.
 *
 * @template Target - The type that `Value` should be assignable to.
 * @template Value - The type to check against `Target`.
 */
export type TypeOf<Target, Value> = Exclude<Value, Target> extends never
    ? true
    : false;

/**
 * Checks that `Value` is equal to the same type as `Target`.
 *
 * @example
 * ```ts
 * expectType<TypeEqual<123, 123>>(true);
 * expectType<TypeEqual<123, number>>(false);
 * expectType<TypeEqual<number, 123>>(false);
 * expectType<TypeEqual<number, number>>(true);
 * ```
 *
 * See also [`expectType`]{@link expectType}.
 *
 * @template Target - The first type to compare.
 * @template Value - The second type to compare.
 */
export type TypeEqual<Target, Value> = (<T>() => T extends Target
    ? 1
    : 2) extends <T>() => T extends Value ? 1 : 2
    ? true
    : false;

/**
 * Asserts the `value` type is assignable to the generic `Type`.
 *
 * @example
 * ```ts
 * expectType<number>(123);
 * expectType<boolean>(true);
 * ```
 *
 * See also [`TypeOf`]{@link TypeOf} and [`TypeEqual`]{@link TypeEqual}.
 *
 * @param _ - The value to check.
 * @template Type - The type to check against.
 */
export const expectType = <Type>(_: Type): void => void 0;

/**
 * Asserts the `value` type is `never`, i.e. this function should never be called.
 * If it is called at runtime, it will throw a `TypeError`. The return type is
 * `never` to support returning in exhaustive type checks.
 *
 * @example
 * ```ts
 * return expectNever(value);
 * ```
 *
 * @param value - The value that should be `never`.
 * @returns This function never returns normally (it throws or is unreachable).
 */
export const expectNever = (value: never): never => {
    throw new TypeError("Unexpected value: " + value);
};
