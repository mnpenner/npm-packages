export interface IDictionary<TValue> {
    [key: string]: TValue // TS1023 prevents us from allowing arbitrary keys (symbols)
}

// TS2461: Type 'Iterable' is not an array type.
// https://github.com/Microsoft/TypeScript/issues/4130
export interface _Console {
    assert(test?: boolean, message?: string, ...optionalParams: any[]): void;
    clear(): void;
    count(countTitle?: string): void;
    debug(...optionalParams: any[]): void;
    dir(value?: any, ...optionalParams: any[]): void;
    dirxml(value: any): void;
    error(...optionalParams: any[]): void;
    exception(message?: string, ...optionalParams: any[]): void;
    group(groupTitle?: string): void;
    groupCollapsed(groupTitle?: string): void;
    groupEnd(): void;
    info(...optionalParams: any[]): void;
    log(...optionalParams: any[]): void;
    msIsIndependentlyComposed(element: any): boolean;
    profile(reportName?: string): void;
    profileEnd(): void;
    select(element: any): void;
    table(...data: any[]): void;
    time(timerName?: string): void;
    timeEnd(timerName?: string): void;
    trace(...optionalParams: any[]): void;
    warn(...optionalParams: any[]): void;
}

// http://json.org/
export type JsonType = string|number|object|Array<any>|boolean|null;

/**
 * A decorator is a function that takes in a function and returns a new function that accepts the same args,
 * but adds some extra functionality.
 */
// export type Decorator<F extends Function> = (fn: F) => F;