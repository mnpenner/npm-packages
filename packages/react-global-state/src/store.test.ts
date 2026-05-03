import { describe, expect, test } from 'bun:test'
import { createLocalStorageStore, createStore } from './index'

class MemoryStorage implements StorageLike {
    readonly items = new Map<string, string>()

    getItem(key: string) {
        return this.items.get(key) ?? null
    }

    setItem(key: string, value: string) {
        this.items.set(key, value)
    }
}

interface StorageLike {
    getItem(key: string): string | null
    setItem(key: string, value: string): void
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
        store.set({ count: 1 })
        store.set({ count: 2 })
        unsubscribe()
        store.set({ count: 3 })

        expect(store.get()).toEqual({ count: 3 })
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

        expect(store.get()).toEqual({ theme: 'dark' })

        store.set({ theme: 'system' })

        expect(storage.getItem('settings')).toBe(JSON.stringify({ theme: 'system' }))
    })
})
