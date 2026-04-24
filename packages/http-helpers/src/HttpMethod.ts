/**
 * HTTP request methods as defined by the RFCs.
 *
 * @example
 * ```ts
 * const method: HttpMethod = HttpMethod.GET
 * ```
 */
export const enum HttpMethod {
    /**
     * The GET method requests a representation of the specified resource. Requests using GET should only retrieve
     * data and should not contain a request content.
     */
    GET = 'GET',
    /**
     * The HEAD method asks for a response identical to a GET request, but without a response body.
     */
    HEAD = 'HEAD',
    /**
     * The POST method submits an entity to the specified resource, often causing a change in state or side effects on
     * the server.
     */
    POST = 'POST',
    /**
     * The PUT method replaces all current representations of the target resource with the request content.
     */
    PUT = 'PUT',
    /**
     * The DELETE method deletes the specified resource.
     */
    DELETE = 'DELETE',
    /**
     * The CONNECT method establishes a tunnel to the server identified by the target resource.
     */
    CONNECT = 'CONNECT',
    /**
     * The OPTIONS method describes the communication options for the target resource.
     */
    OPTIONS = 'OPTIONS',
    /**
     * The TRACE method performs a message loop-back test along the path to the target resource.
     */
    TRACE = 'TRACE',
    /**
     * The PATCH method applies partial modifications to a resource.
     */
    PATCH = 'PATCH',
}
