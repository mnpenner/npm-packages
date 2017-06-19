export interface IDictionary<TValue> {
    [key: string]: TValue // TS1023 prevents us from allowing arbitrary keys (symbols)
}

/**
 * A decorator is a function that takes in a function and returns a new function that accepts the same args,
 * but adds some extra functionality.
 */
// export type Decorator<F extends Function> = (fn: F) => F;