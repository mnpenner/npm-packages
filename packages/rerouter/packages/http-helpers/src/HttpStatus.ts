export const enum HttpStatus {
    // --- 1xx Informational ---
    /**
     * 100 Continue - The server has received the request headers and the client should proceed to send the request
     * body.
     */
    CONTINUE = 100,
    /**
     * 101 Switching Protocols - The requester has asked the server to switch protocols.
     */
    SWITCHING_PROTOCOLS = 101,
    /**
     * 102 Processing - The server is processing the request but no response is available yet.
     */
    PROCESSING = 102,
    /**
     * 103 Early Hints - Used to return some response headers before the final response.
     */
    EARLY_HINTS = 103,

    // --- 2xx Success ---
    /**
     * 200 OK - Standard response for successful HTTP requests.
     */
    OK = 200,
    /**
     * 201 Created - The request has been fulfilled and resulted in a new resource being created.
     */
    CREATED = 201,
    /**
     * 202 Accepted - The request has been accepted for processing, but the processing is not complete.
     */
    ACCEPTED = 202,
    /**
     * 203 Non-Authoritative Information - The server successfully processed the request but is returning information
     * from a third party.
     */
    NON_AUTHORITATIVE_INFORMATION = 203,
    /**
     * 204 No Content - The server successfully processed the request, but is not returning any content.
     */
    NO_CONTENT = 204,
    /**
     * 205 Reset Content - Tells the client to reset the document view.
     */
    RESET_CONTENT = 205,
    /**
     * 206 Partial Content - The server is delivering only part of the resource due to a range header.
     */
    PARTIAL_CONTENT = 206,
    /**
     * 207 Multi-Status - Provides status for multiple independent operations (WebDAV).
     */
    MULTI_STATUS = 207,
    /**
     * 208 Already Reported - The members of a DAV binding have already been enumerated (WebDAV).
     */
    ALREADY_REPORTED = 208,
    /**
     * 226 IM Used - The server fulfilled a request for the resource, and the response is a result of
     * instance-manipulations.
     */
    IM_USED = 226,

    // --- 3xx Redirection ---
    /**
     * 300 Multiple Choices - Indicates multiple options for the resource that the client may follow.
     */
    MULTIPLE_CHOICES = 300,
    /**
     * 301 Moved Permanently - This and all future requests should be directed to the given URI.
     */
    MOVED_PERMANENTLY = 301,
    /**
     * 302 Found - Tells the client to look at another URL.
     */
    FOUND = 302,
    /**
     * 303 See Other - The response to the request can be found under another URI using the GET method.
     */
    SEE_OTHER = 303,
    /**
     * 304 Not Modified - Indicates that the resource has not been modified since the last request.
     */
    NOT_MODIFIED = 304,
    /**
     * 305 Use Proxy - The requested resource is available only through a proxy.
     */
    USE_PROXY = 305,
    /**
     * 306 Switch Proxy - No longer used; originally meant "Subsequent requests should use the specified proxy."
     */
    SWITCH_PROXY = 306,
    /**
     * 307 Temporary Redirect - The request should be repeated with another URI; future requests can still use the
     * original URI.
     */
    TEMPORARY_REDIRECT = 307,
    /**
     * 308 Permanent Redirect - The request and all future requests should be repeated using another URI.
     */
    PERMANENT_REDIRECT = 308,

    // --- 4xx Client Errors ---
    /**
     * 400 Bad Request - The server could not understand the request due to invalid syntax.
     */
    BAD_REQUEST = 400,
    /**
     * 401 Unauthorized - The client must authenticate itself to get the requested response.
     */
    UNAUTHORIZED = 401,
    /**
     * 402 Payment Required - Reserved for future use.
     */
    PAYMENT_REQUIRED = 402,
    /**
     * 403 Forbidden - The client does not have access rights to the content.
     */
    FORBIDDEN = 403,
    /**
     * 404 Not Found - The server can not find the requested resource.
     */
    NOT_FOUND = 404,
    /**
     * 405 Method Not Allowed - The request method is known by the server but is not supported by the target resource.
     */
    METHOD_NOT_ALLOWED = 405,
    /**
     * 406 Not Acceptable - The server cannot produce a response matching the list of acceptable values.
     */
    NOT_ACCEPTABLE = 406,
    /**
     * 407 Proxy Authentication Required - The client must first authenticate with the proxy.
     */
    PROXY_AUTHENTICATION_REQUIRED = 407,
    /**
     * 408 Request Timeout - The server timed out waiting for the request.
     */
    REQUEST_TIMEOUT = 408,
    /**
     * 409 Conflict - The request could not be processed because of conflict in the request.
     */
    CONFLICT = 409,
    /**
     * 410 Gone - The resource requested is no longer available.
     */
    GONE = 410,
    /**
     * 411 Length Required - The request did not specify the length of its content.
     */
    LENGTH_REQUIRED = 411,
    /**
     * 412 Precondition Failed - One of the preconditions in the request header fields evaluated to false.
     */
    PRECONDITION_FAILED = 412,
    /**
     * 413 Payload Too Large - The request is larger than the server is willing or able to process.
     */
    PAYLOAD_TOO_LARGE = 413,
    /**
     * 414 URI Too Long - The URI provided was too long for the server to process.
     */
    URI_TOO_LONG = 414,
    /**
     * 415 Unsupported Media Type - The request entity has a media type which the server does not support.
     */
    UNSUPPORTED_MEDIA_TYPE = 415,
    /**
     * 416 Range Not Satisfiable - The client has asked for a portion of the file, but the server cannot supply that
     * portion.
     */
    RANGE_NOT_SATISFIABLE = 416,
    /**
     * 417 Expectation Failed - The server cannot meet the requirements of the Expect request-header field.
     */
    EXPECTATION_FAILED = 417,
    /**
     * 418 I'm a teapot - This code was defined in 1998 as one of the traditional IETF April Fools' jokes.
     */
    IM_A_TEAPOT = 418,
    /**
     * 421 Misdirected Request - The request was directed at a server that is not able to produce a response.
     */
    MISDIRECTED_REQUEST = 421,
    /**
     * 422 Unprocessable Entity - The request was well-formed but was unable to be followed due to semantic errors.
     */
    UNPROCESSABLE_ENTITY = 422,
    /**
     * 423 Locked - The resource that is being accessed is locked.
     */
    LOCKED = 423,
    /**
     * 424 Failed Dependency - The request failed due to failure of a previous request.
     */
    FAILED_DEPENDENCY = 424,
    /**
     * 425 Too Early - Indicates that the server is unwilling to risk processing a request that might be replayed.
     */
    TOO_EARLY = 425,
    /**
     * 426 Upgrade Required - The client should switch to a different protocol such as TLS/1.0.
     */
    UPGRADE_REQUIRED = 426,
    /**
     * 428 Precondition Required - The origin server requires the request to be conditional.
     */
    PRECONDITION_REQUIRED = 428,
    /**
     * 429 Too Many Requests - The user has sent too many requests in a given amount of time.
     */
    TOO_MANY_REQUESTS = 429,
    /**
     * 431 Request Header Fields Too Large - The server is unwilling to process the request because either an
     * individual header field, or all the header fields collectively, are too large.
     */
    REQUEST_HEADER_FIELDS_TOO_LARGE = 431,
    /**
     * 499 Client Closed Request - The client closed the connection before the server could respond.
     */
    CLIENT_CLOSED_REQUEST = 499,
    /**
     * 451 Unavailable For Legal Reasons - The user requests an illegal resource, such as a web page censored by a
     * government.
     */
    UNAVAILABLE_FOR_LEGAL_REASONS = 451,

    // --- 5xx Server Errors ---
    /**
     * 500 Internal Server Error - A generic error message, given when an unexpected condition was encountered.
     */
    INTERNAL_SERVER_ERROR = 500,
    /**
     * 501 Not Implemented - The server either does not recognize the request method, or it lacks the ability to
     * fulfil the request.
     */
    NOT_IMPLEMENTED = 501,
    /**
     * 502 Bad Gateway - The server was acting as a gateway or proxy and received an invalid response from the
     * upstream server.
     */
    BAD_GATEWAY = 502,
    /**
     * 503 Service Unavailable - The server is currently unavailable (because it is overloaded or down for
     * maintenance).
     */
    SERVICE_UNAVAILABLE = 503,
    /**
     * 504 Gateway Timeout - The server was acting as a gateway or proxy and did not receive a timely response from
     * the upstream server.
     */
    GATEWAY_TIMEOUT = 504,
    /**
     * 505 HTTP Version Not Supported - The server does not support the HTTP protocol version used in the request.
     */
    HTTP_VERSION_NOT_SUPPORTED = 505,
    /**
     * 506 Variant Also Negotiates - Transparent content negotiation for the request results in a circular reference.
     */
    VARIANT_ALSO_NEGOTIATES = 506,
    /**
     * 507 Insufficient Storage - The server is unable to store the representation needed to complete the request.
     */
    INSUFFICIENT_STORAGE = 507,
    /**
     * 508 Loop Detected - The server detected an infinite loop while processing the request.
     */
    LOOP_DETECTED = 508,
    /**
     * 510 Not Extended - Further extensions to the request are required for the server to fulfil it.
     */
    NOT_EXTENDED = 510,
    /**
     * 511 Network Authentication Required - The client needs to authenticate to gain network access.
     */
    NETWORK_AUTHENTICATION_REQUIRED = 511,
}
