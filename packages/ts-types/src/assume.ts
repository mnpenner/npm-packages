/**
 * Casts a value to a specific type without any runtime check.
 * Use this sparingly when you are certain of the type but TypeScript cannot infer it.
 *
 * See also [`assumeProps`]{@link assumeProps}.
 *
 * @example
 * ```ts
 * assumeType<string>(someUnknownValue);
 * console.log(someUnknownValue.toUpperCase());
 * ```
 *
 * @param _val - The value to assert the type of.
 * @template T - The type to assert.
 */
export function assumeType<T>(_val: any): asserts _val is T { /* no implementation */ }
