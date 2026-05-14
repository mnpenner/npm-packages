/**
 * Headers initializer accepted by the active Fetch runtime.
 *
 * @internal
 */
export type RouterHeadersInit = NonNullable<ConstructorParameters<typeof Headers>[0]>

/**
 * Response body initializer accepted by the active Fetch runtime.
 *
 * @internal
 */
export type RouterBodyInit = NonNullable<ConstructorParameters<typeof Response>[0]>
