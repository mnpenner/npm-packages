/**
 * Response Content-Types, including typical charset if applicable.
 */
export const enum ContentType {
    JSON = 'application/json',
    YAML = 'application/yaml; charset=utf-8',
    HTML = 'text/html; charset=utf-8',
    PLAIN_TEXT = 'text/plain; charset=utf-8',
    OCTET_STREAM = 'application/octet-stream',
    EVENT_STREAM = 'text/event-stream',
}
