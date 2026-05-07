import type { Initializer, StoreOptions } from './store'
import { createStore } from './react'

export type StorageLike = Pick<Storage, 'getItem' | 'setItem'>

export interface LocalStorageStoreOptions<T> extends StoreOptions<T> {
    storage?: StorageLike | null
    serialize?: (value: T) => string
    deserialize?: (value: string) => T
    onError?: (error: unknown, operation: 'read' | 'write') => void
}

function getDefaultStorage() {
    if (typeof globalThis.localStorage === 'undefined') {
        return null
    }

    return globalThis.localStorage
}

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
