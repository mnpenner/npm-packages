import { describe, expect, test } from 'bun:test'
import { createLocalStorageStore, createStore, type StorageLike } from './index'

class MemoryStorage implements StorageLike {
    readonly items = new Map<string, string>()

    getItem(key: string) {
        return this.items.get(key) ?? null
    }

    setItem(key: string, value: string) {
        this.items.set(key, value)
    }
}

describe('Store', () => {
    test('sets and subscribes to state outside React', () => {
        const store = createStore({ count: 0 })
        const values: number[] = []

        const unsubscribe = store.subscribeSelector(
            (state) => state.count,
            (value) => values.push(value),
        )

        store.setState((state) => ({ count: state.count + 1 }))
        store.setState({ count: 1 })
        store.setState({ count: 2 })
        unsubscribe()
        store.setState({ count: 3 })

        expect(store.getSnapshot()).toEqual({ count: 3 })
        expect(values).toEqual([1, 2])
    })

    test('can fire subscriptions immediately', () => {
        const store = createStore('ready')
        const values: string[] = []

        store.subscribe((value) => values.push(value), { fireImmediately: true })

        expect(values).toEqual(['ready'])
    })
})

describe('createLocalStorageStore', () => {
    test('restores state and persists updates', () => {
        const storage = new MemoryStorage()
        storage.setItem('settings', JSON.stringify({ theme: 'dark' }))

        const store = createLocalStorageStore('settings', { theme: 'light' }, { storage })

        expect(store.getSnapshot()).toEqual({ theme: 'dark' })

        store.setState({ theme: 'system' })

        expect(storage.getItem('settings')).toBe(JSON.stringify({ theme: 'system' }))
    })

    test('uses the initial value without storage', () => {
        const store = createLocalStorageStore('settings', () => ({ theme: 'light' }), {
            storage: null,
        })

        expect(store.getSnapshot()).toEqual({ theme: 'light' })

        store.setState({ theme: 'dark' })

        expect(store.getSnapshot()).toEqual({ theme: 'dark' })
    })

    test('uses global localStorage by default', () => {
        const storage = new MemoryStorage()
        const previousLocalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')

        Object.defineProperty(globalThis, 'localStorage', {
            configurable: true,
            value: storage,
        })

        try {
            const store = createLocalStorageStore('settings', { theme: 'light' })

            store.setState({ theme: 'dark' })

            expect(storage.getItem('settings')).toBe(JSON.stringify({ theme: 'dark' }))
        } finally {
            if (previousLocalStorage === undefined) {
                delete (globalThis as { localStorage?: Storage }).localStorage
            } else {
                Object.defineProperty(globalThis, 'localStorage', previousLocalStorage)
            }
        }
    })

    test('reports read and write errors', () => {
        const readError = new Error('read failed')
        const writeError = new Error('write failed')
        const errors: Array<[unknown, 'read' | 'write']> = []
        const storage: StorageLike = {
            getItem() {
                throw readError
            },
            setItem() {
                throw writeError
            },
        }

        const store = createLocalStorageStore(
            'settings',
            { theme: 'light' },
            {
                onError(error, operation) {
                    errors.push([error, operation])
                },
                storage,
            },
        )

        store.setState({ theme: 'dark' })

        expect(store.getSnapshot()).toEqual({ theme: 'dark' })
        expect(errors).toEqual([
            [readError, 'read'],
            [writeError, 'write'],
        ])
    })

    test('uses custom serialization', () => {
        const storage = new MemoryStorage()
        storage.setItem('settings', 'dark')

        const store = createLocalStorageStore(
            'settings',
            { theme: 'light' },
            {
                deserialize(value) {
                    return { theme: value }
                },
                serialize(value) {
                    return value.theme
                },
                storage,
            },
        )

        store.setState({ theme: 'system' })

        expect(store.getSnapshot()).toEqual({ theme: 'system' })
        expect(storage.getItem('settings')).toBe('system')
    })
})
