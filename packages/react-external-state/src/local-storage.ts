import type { Initializer, StoreOptions } from './store'
import { createStore } from './react'

/**
 * Minimal storage API used by [`createLocalStorageStore`]{@link createLocalStorageStore}.
 *
 * @example
 * ```ts
 * const memory = new Map<string, string>()
 * const memoryStorage: StorageLike = {
 *     getItem: (key) => memory.get(key) ?? null,
 *     setItem: (key, value) => memory.set(key, value),
 * }
 * ```
 *
 * @param key - Storage key to read or write.
 * @param value - Serialized value to write.
 * @returns The stored value for reads, or nothing for writes.
 */
export type StorageLike = Pick<Storage, 'getItem' | 'setItem'>

/**
 * Options for stores persisted to localStorage-compatible storage.
 *
 * @example
 * ```ts
 * const options: LocalStorageStoreOptions<{ theme: string }> = {
 *     onError(error, operation) {
 *         console.warn(operation, error)
 *     },
 * }
 * ```
 *
 * @typeParam T - The persisted state value type.
 */
export interface LocalStorageStoreOptions<T> extends StoreOptions<T> {
    /**
     * Storage implementation to read and write values.
     */
    storage?: StorageLike | null

    /**
     * Converts state into a string before writing to storage.
     *
     * @param value - State value to serialize.
     * @returns Serialized state.
     */
    serialize?: (value: T) => string

    /**
     * Converts stored strings back into state values.
     *
     * @param value - Stored string to deserialize.
     * @returns Deserialized state.
     */
    deserialize?: (value: string) => T

    /**
     * Receives storage read and write errors.
     *
     * @param error - Error thrown by the storage, serializer, or deserializer.
     * @param operation - Storage operation that failed.
     * @returns Nothing.
     */
    onError?: (error: unknown, operation: 'read' | 'write') => void
}

function getDefaultStorage() {
    if (typeof globalThis.localStorage === 'undefined') {
        return null
    }

    return globalThis.localStorage
}

/**
 * Creates a React-aware store synchronized to localStorage-compatible storage.
 *
 * @example
 * ```ts
 * const settings = createLocalStorageStore('app.settings', {
 *     theme: 'system',
 * })
 *
 * settings.setState((state) => ({ ...state, theme: 'dark' }))
 * ```
 *
 * @param key - Storage key used to read and write state.
 * @param initialValue - Initial value used when storage has no saved value.
 * @param options - Storage and store behavior options.
 * @returns A React-aware store initialized from storage when possible.
 */
export function createLocalStorageStore<T>(
    key: string,
    initialValue: Initializer<T>,
    options?: LocalStorageStoreOptions<T>,
) {
    const storage = options?.storage === undefined ? getDefaultStorage() : options.storage
    const deserialize = options?.deserialize ?? (JSON.parse as (value: string) => T)
    const serialize = options?.serialize ?? JSON.stringify
    let value = initialValue

    if (storage !== null) {
        try {
            const storedValue = storage.getItem(key)

            if (storedValue !== null) {
                value = deserialize(storedValue)
            }
        } catch (error) {
            options?.onError?.(error, 'read')
        }
    }

    const store = createStore(value, options)

    store.subscribe((nextValue) => {
        if (storage === null) {
            return
        }

        try {
            storage.setItem(key, serialize(nextValue))
        } catch (error) {
            options?.onError?.(error, 'write')
        }
    })

    return store
}
