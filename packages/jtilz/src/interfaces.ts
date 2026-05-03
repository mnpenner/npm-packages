/**
 * A dictionary of values.
 */
export type IDictionary<TValue> = Record<PropertyKey, TValue>

// TS2461: Type 'Iterable' is not an array type.
// https://github.com/Microsoft/TypeScript/issues/4130
/**
 * Interface representing the console.
 */
export interface Console {
    assert(test?: boolean, message?: string, ...optionalParams: any[]): void
    clear(): void
    count(countTitle?: string): void
    debug(...optionalParams: any[]): void
    dir(value?: any, ...optionalParams: any[]): void
    dirxml(value: any): void
    error(...optionalParams: any[]): void
    exception(message?: string, ...optionalParams: any[]): void
    group(groupTitle?: string): void
    groupCollapsed(groupTitle?: string): void
    groupEnd(): void
    info(...optionalParams: any[]): void
    log(...optionalParams: any[]): void
    profile(reportName?: string): void
    profileEnd(): void
    table(...data: any[]): void
    time(timerName?: string): void
    timeEnd(timerName?: string): void
    trace(...optionalParams: any[]): void
    warn(...optionalParams: any[]): void
}

// http://json.org/
/**
 * JSON array type.
 */
export type JsonArray = JsonValue[]
/**
 * JSON object type.
 */
export interface JsonObject {
    [id: string]: JsonValue
}
/**
 * JSON value type.
 */
export type JsonValue = string | number | JsonObject | JsonArray | boolean | null

/**
 * A decorator is a function that takes in a function and returns a new function that accepts the same args,
 * but adds some extra functionality.
 */
// export type Decorator<F extends (...args: any[]) => any> = (fn: F) => F;
