import { CommonContentTypes } from '@mpen/http'
import type { RouterBodyInit } from '../fetch-types'

type MaybePromise<T> = T | Promise<T>

/**
 * Serializer used by the router when a logical response has no explicit `Content-Type`.
 *
 * @example
 * ```ts
 * const json = jsonSerializer()
 * ```
 */
export interface BodySerializer<T = unknown> {
    /**
     * Media types this serializer can produce.
     */
    mediaTypes: readonly string[]
    /**
     * Return `true` when this serializer can encode the provided value.
     *
     * @param value - Logical response body to inspect.
     * @returns Whether `value` can be serialized by this serializer.
     */
    canSerialize(value: unknown): value is T
    /**
     * Encode a logical response body into a native Fetch response body.
     *
     * @param value - Logical response body to encode.
     * @returns Native response body data.
     */
    serialize(value: T): MaybePromise<RouterBodyInit | null>
}

/**
 * Create the default JSON body serializer.
 *
 * @example
 * ```ts
 * const router = new Router({serializers: [jsonSerializer()]})
 * ```
 *
 * @returns Serializer for `application/json`.
 */
export function jsonSerializer(): BodySerializer<unknown> {
    return {
        mediaTypes: [CommonContentTypes.JSON],
        canSerialize: (_value): _value is unknown => true,
        serialize: (value) => (value === undefined ? null : JSON.stringify(value)),
    }
}
