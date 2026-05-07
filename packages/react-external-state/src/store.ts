/**
 * Compares two values and returns whether they should be treated as equivalent.
 *
 * @example
 * ```ts
 * const isSameCount: EqualityFn<{ count: number }> = (a, b) => a.count === b.count
 * ```
 *
 * @param a - First value to compare.
 * @param b - Second value to compare.
 * @returns Whether the values are equivalent.
 * @typeParam T - The value type being compared.
 */
export type EqualityFn<T> = (a: T, b: T) => boolean

/**
 * A value or lazy initializer function used to create an initial store snapshot.
 *
 * @example
 * ```ts
 * const initial: Initializer<{ count: number }> = () => ({ count: 0 })
 * ```
 *
 * @returns The initialized value when used as a function.
 * @typeParam T - The initialized value type.
 */
export type Initializer<T> = T | (() => T)

/**
 * Selects a derived value from a store snapshot.
 *
 * @example
 * ```ts
 * const selectCount: Selector<{ count: number }, number> = (state) => state.count
 * ```
 *
 * @param value - Source value to select from.
 * @returns The selected value.
 * @typeParam T - The source snapshot type.
 * @typeParam S - The selected value type.
 */
export type Selector<T, S = T> = (value: T) => S

/**
 * A next value or updater function for replacing store state.
 *
 * @example
 * ```ts
 * const increment: StateUpdater<{ count: number }> = (state) => ({ count: state.count + 1 })
 * ```
 *
 * @param previous - Previous state when used as a function.
 * @returns The next state when used as a function.
 * @typeParam T - The state value type.
 */
export type StateUpdater<T> = T | ((previous: T) => T)

/**
 * Receives the next and previous values when a subscribed store value changes.
 *
 * @example
 * ```ts
 * const listener: StoreListener<number> = (value, previousValue) => {
 *     console.log(previousValue, value)
 * }
 * ```
 *
 * @param value - The next value.
 * @param previousValue - The previous value.
 * @returns Nothing.
 * @typeParam T - The listened value type.
 */
export type StoreListener<T> = (value: T, previousValue: T) => void

/**
 * Stops a subscription created by [`Store.subscribe`]{@link Store#subscribe}.
 *
 * @example
 * ```ts
 * const unsubscribe: Unsubscribe = store.subscribe(() => {})
 * unsubscribe()
 * ```
 *
 * @returns Nothing.
 */
export type Unsubscribe = () => void

/**
 * A minimal external store shape compatible with React snapshot subscriptions.
 *
 * @example
 * ```ts
 * function readCurrent<T>(store: StoreSnapshot<T>) {
 *     return store.getSnapshot()
 * }
 * ```
 *
 * @typeParam T - The snapshot value type.
 */
export interface StoreSnapshot<T> {
    /**
     * Subscribes to snapshot changes.
     *
     * @example
     * ```ts
     * const unsubscribe = store.subscribe(() => {
     *     console.log(store.getSnapshot())
     * })
     * ```
     *
     * @param listener - Callback invoked after the snapshot changes.
     * @returns A function that removes the subscription.
     */
    subscribe(listener: () => void): Unsubscribe

    /**
     * Returns the current non-reactive snapshot value.
     *
     * @example
     * ```ts
     * const snapshot = store.getSnapshot()
     * ```
     *
     * @returns The current snapshot value.
     */
    getSnapshot(): T
}

/**
 * Options for creating a [`Store`]{@link Store}.
 *
 * @example
 * ```ts
 * const options: StoreOptions<{ count: number }> = {
 *     isEqual: (a, b) => a.count === b.count,
 * }
 * ```
 *
 * @typeParam T - The state value type.
 */
export interface StoreOptions<T> {
    /**
     * Compares full state values before publishing an update.
     */
    isEqual?: EqualityFn<T>
}

/**
 * Options for [`Store.subscribe`]{@link Store#subscribe} and
 * [`Store.subscribeSelector`]{@link Store#subscribeSelector}.
 *
 * @example
 * ```ts
 * store.subscribe(listener, { fireImmediately: true })
 * ```
 *
 * @typeParam T - The subscribed value type.
 */
export interface SubscribeOptions<T> {
    /**
     * Calls the listener once with the current value immediately after subscribing.
     */
    fireImmediately?: boolean

    /**
     * Compares selected values before publishing a selected update.
     */
    isEqual?: EqualityFn<T>
}

const identity = <T>(value: T) => value

/**
 * Resolves a value from an [`Initializer`]{@link Initializer}.
 *
 * @example
 * ```ts
 * const value = resolveInitializer(() => ({ count: 0 }))
 * ```
 *
 * @param value - Value or lazy initializer to resolve.
 * @returns The resolved value.
 */
export function resolveInitializer<T>(value: Initializer<T>): T {
    if (typeof value === 'function') {
        return (value as () => T)()
    }
    return value
}

/**
 * Resolves a next state value from a [`StateUpdater`]{@link StateUpdater}.
 *
 * @example
 * ```ts
 * const next = resolveStateUpdater((count: number) => count + 1, 0)
 * ```
 *
 * @param value - Next value or updater function.
 * @param previousValue - Previous state passed to updater functions.
 * @returns The resolved next state.
 */
export function resolveStateUpdater<T>(value: StateUpdater<T>, previousValue: T): T {
    if (typeof value === 'function') {
        return (value as (previousValue: T) => T)(previousValue)
    }
    return value
}

/**
 * Imperative external store with selector subscriptions and React snapshot support.
 *
 * @example
 * ```ts
 * const store = new Store({ count: 0 })
 * store.setState((state) => ({ count: state.count + 1 }))
 * console.log(store.getSnapshot())
 * ```
 *
 * @typeParam T - The state value type.
 */
export class Store<T> implements StoreSnapshot<T> {
    readonly #isEqual: EqualityFn<T>
    readonly #listeners = new Set<StoreListener<T>>()
    #value: T

    /**
     * Creates a store with an initial value.
     *
     * @example
     * ```ts
     * const store = new Store({ count: 0 }, { isEqual: Object.is })
     * ```
     *
     * @param initialValue - Initial value or lazy initializer.
     * @param options - Store behavior options.
     */
    constructor(initialValue: Initializer<T>, options?: StoreOptions<T>) {
        this.#value = resolveInitializer(initialValue)
        this.#isEqual = options?.isEqual ?? Object.is
    }

    /**
     * Returns the current non-reactive state snapshot.
     *
     * @example
     * ```ts
     * const current = store.getSnapshot()
     * ```
     *
     * @returns The current state value.
     */
    getSnapshot = () => this.#value

    /**
     * Replaces state with a value or updater function.
     *
     * @example
     * ```ts
     * store.setState((state) => ({ count: state.count + 1 }))
     * ```
     *
     * @param state - Next value or updater function.
     * @returns The current state after applying the update.
     */
    setState = (state: StateUpdater<T>) => {
        const previousValue = this.#value
        const nextValue = resolveStateUpdater(state, previousValue)

        if (this.#isEqual(previousValue, nextValue)) {
            return this.#value
        }

        this.#value = nextValue

        for (const listener of [...this.#listeners]) {
            listener(nextValue, previousValue)
        }

        return nextValue
    }

    /**
     * Subscribes to every state change.
     *
     * @example
     * ```ts
     * const unsubscribe = store.subscribe((value, previousValue) => {
     *     console.log(previousValue, value)
     * })
     * ```
     *
     * @param listener - Callback invoked with the next and previous state.
     * @param options - Subscription options.
     * @returns A function that removes the subscription.
     */
    subscribe = (listener: StoreListener<T>, options?: SubscribeOptions<T>): Unsubscribe => {
        return this.subscribeSelector(identity, listener, options)
    }

    /**
     * Subscribes to changes in a selected value.
     *
     * @example
     * ```ts
     * const unsubscribe = store.subscribeSelector(
     *     (state) => state.count,
     *     (count) => console.log(count),
     * )
     * ```
     *
     * @param selector - Selects the value to compare and publish.
     * @param listener - Callback invoked when the selected value changes.
     * @param options - Subscription options for the selected value.
     * @returns A function that removes the subscription.
     */
    subscribeSelector = <S>(
        selector: Selector<T, S>,
        listener: StoreListener<S>,
        options?: SubscribeOptions<S>,
    ): Unsubscribe => {
        const select = selector
        const isEqual = options?.isEqual ?? Object.is
        let selectedValue = select(this.#value)

        const storeListener: StoreListener<T> = (value) => {
            const nextSelectedValue = select(value)

            if (isEqual(selectedValue, nextSelectedValue)) {
                return
            }

            const previousSelectedValue = selectedValue
            selectedValue = nextSelectedValue
            listener(nextSelectedValue, previousSelectedValue)
        }

        this.#listeners.add(storeListener)

        if (options?.fireImmediately) {
            listener(selectedValue, selectedValue)
        }

        return () => {
            this.#listeners.delete(storeListener)
        }
    }
}

/**
 * Creates a base external store.
 *
 * @example
 * ```ts
 * const store = createStore({ count: 0 })
 * ```
 *
 * @param initialValue - Initial value or lazy initializer.
 * @param options - Store behavior options.
 * @returns A new [`Store`]{@link Store}.
 *
 * @internal
 */
export function createStore<T>(initialValue: Initializer<T>, options?: StoreOptions<T>) {
    return new Store(initialValue, options)
}
