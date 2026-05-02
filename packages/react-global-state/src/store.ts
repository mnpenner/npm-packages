export type EqualityFn<T> = (a: T, b: T) => boolean
export type Initializer<T> = T | (() => T)
export type Selector<T, S = T> = (value: T) => S
export type StateUpdater<T> = T | ((previous: T) => T)
export type StoreListener<T> = (value: T, previousValue: T) => void
export type Unsubscribe = () => void

export interface StoreSnapshot<T> {
    subscribe(listener: () => void): Unsubscribe
    getSnapshot(): T
}

export interface StoreOptions<T> {
    isEqual?: EqualityFn<T>
}

export interface SubscribeOptions<T> {
    fireImmediately?: boolean
    isEqual?: EqualityFn<T>
}

const identity = <T>(value: T) => value

export function resolveInitializer<T>(value: Initializer<T>): T {
    if(typeof value === 'function') {
        return (value as () => T)()
    }
    return value
}

export function resolveStateUpdater<T>(value: StateUpdater<T>, previousValue: T): T {
    if(typeof value === 'function') {
        return (value as (previousValue: T) => T)(previousValue)
    }
    return value
}

export class Store<T> implements StoreSnapshot<T> {
    readonly #isEqual: EqualityFn<T>
    readonly #listeners = new Set<StoreListener<T>>()
    #value: T

    constructor(initialValue: Initializer<T>, options?: StoreOptions<T>) {
        this.#value = resolveInitializer(initialValue)
        this.#isEqual = options?.isEqual ?? Object.is
    }

    getSnapshot = () => this.#value

    get = () => this.#value

    setState = (state: StateUpdater<T>) => {
        const previousValue = this.#value
        const nextValue = resolveStateUpdater(state, previousValue)

        if(this.#isEqual(previousValue, nextValue)) {
            return this.#value
        }

        this.#value = nextValue

        for(const listener of [...this.#listeners]) {
            listener(nextValue, previousValue)
        }

        return nextValue
    }

    set = this.setState

    subscribe = (
        listener: StoreListener<T>,
        options?: SubscribeOptions<T>,
    ): Unsubscribe => {
        return this.subscribeSelector(identity, listener, options)
    }

    subscribeSelector = <S>(
        selector: Selector<T, S>,
        listener: StoreListener<S>,
        options?: SubscribeOptions<S>,
    ): Unsubscribe => {
        const select = selector
        const isEqual = options?.isEqual ?? Object.is
        let selectedValue = select(this.#value)

        const storeListener: StoreListener<T> = value => {
            const nextSelectedValue = select(value)

            if(isEqual(selectedValue, nextSelectedValue)) {
                return
            }

            const previousSelectedValue = selectedValue
            selectedValue = nextSelectedValue
            listener(nextSelectedValue, previousSelectedValue)
        }

        this.#listeners.add(storeListener)

        if(options?.fireImmediately) {
            listener(selectedValue, selectedValue)
        }

        return () => {
            this.#listeners.delete(storeListener)
        }
    }
}

export function createStore<T>(initialValue: Initializer<T>, options?: StoreOptions<T>) {
    return new Store(initialValue, options)
}
