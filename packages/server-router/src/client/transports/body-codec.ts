/**
 * The response body stream exposed to response body codecs.
 *
 * @example
 * ```ts
 * const text = await new Response(body).text()
 * ```
 */
export type ResponseBodyReader = ReadableStream<Uint8Array<ArrayBufferLike>> | null

/**
 * Serializes request bodies and deserializes response bodies for generated clients.
 *
 * @example
 * ```ts
 * const textJsonCodec: BodyCodec = {
 *     serialize: (value) => JSON.stringify(value),
 *     deserialize: async (body) => JSON.parse(await new Response(body).text()),
 * }
 * ```
 */
export interface BodyCodec {
    /**
     * Serialize a generated client body value into a Fetch-compatible body.
     *
     * @param value - The generated client body value.
     * @returns A Fetch-compatible body, or nullish to omit the request body.
     */
    serialize(value: unknown): BodyInit | null | undefined

    /**
     * Deserialize a response body for typed `response.parseBody()` calls.
     *
     * @param body - The response body stream.
     * @param contentType - The response content type, when present.
     * @returns The deserialized response body.
     * @typeParam T - The expected response body type.
     */
    deserialize<T>(body: ResponseBodyReader, contentType: string | null): Promise<T>
}

/**
 * The default JSON codec used by generated API clients.
 *
 * @example
 * ```ts
 * const client = new ApiClient(new FetchTransport({ bodyCodec: jsonBodyCodec }))
 * ```
 */
export const jsonBodyCodec: BodyCodec = {
    serialize: (value) => JSON.stringify(value),
    deserialize: async <T>(body: ResponseBodyReader) => (await new Response(body).json()) as T,
}
