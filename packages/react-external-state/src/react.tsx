import {
    createContext as createReactContext,
    useContext,
    useMemo,
    useState as useReactState,
    useSyncExternalStore,
} from 'react'
import type { ReactNode } from 'react'
import {
    createStore as createBaseStore,
    resolveInitializer,
    resolveStateUpdater,
    Store,
} from './store'
import type {
    EqualityFn,
    Initializer,
    Selector,
    StateUpdater,
    StoreOptions,
    StoreSnapshot,
} from './store'

export interface UseStoreOptions<S> {
    isEqual?: EqualityFn<S>
}

export interface ReactStore<T> extends Store<T> {
    useValue(): T
    useValue<S>(selector: Selector<T, S>, options?: UseStoreOptions<S>): S
}

export interface StoreProviderProps<T> {
    children?: ReactNode
    initialValue?: StateUpdater<T>
}

const identity = <T,>(value: T) => value

function createSelectedSnapshot<T, S>(
    store: StoreSnapshot<T>,
    selector: Selector<T, S>,
    isEqual: EqualityFn<S>,
) {
    let hasSnapshot = false
    let lastStoreSnapshot: T
    let lastSelectedSnapshot: S

    return () => {
        const storeSnapshot = store.getSnapshot()

        if (hasSnapshot && Object.is(storeSnapshot, lastStoreSnapshot)) {
            return lastSelectedSnapshot
        }

        const selectedSnapshot = selector(storeSnapshot)

        if (hasSnapshot && isEqual(lastSelectedSnapshot, selectedSnapshot)) {
            lastStoreSnapshot = storeSnapshot
            return lastSelectedSnapshot
        }

        hasSnapshot = true
        lastStoreSnapshot = storeSnapshot
        lastSelectedSnapshot = selectedSnapshot
        return selectedSnapshot
    }
}

function useStoreValue<T>(store: StoreSnapshot<T>): T
function useStoreValue<T, S>(
    store: StoreSnapshot<T>,
    selector: Selector<T, S>,
    options?: UseStoreOptions<S>,
): S
function useStoreValue<T, S = T>(
    store: StoreSnapshot<T>,
    selector: Selector<T, S> = identity as Selector<T, S>,
    options?: UseStoreOptions<S>,
) {
    const getSnapshot = useMemo(
        () => createSelectedSnapshot(store, selector, options?.isEqual ?? Object.is),
        [store, selector, options?.isEqual],
    )

    return useSyncExternalStore(
        (onStoreChange) => store.subscribe(onStoreChange),
        getSnapshot,
        getSnapshot,
    )
}

export function createStore<T>(
    initialValue: Initializer<T>,
    options?: StoreOptions<T>,
): ReactStore<T> {
    const store = createBaseStore(initialValue, options) as ReactStore<T>

    function useValue(): T
    function useValue<S>(selector: Selector<T, S>, useOptions?: UseStoreOptions<S>): S
    function useValue<S = T>(selector?: Selector<T, S>, useOptions?: UseStoreOptions<S>) {
        return useStoreValue(store, selector ?? (identity as Selector<T, S>), useOptions)
    }

    store.useValue = useValue

    return store
}

export function createStoreContext<T>(defaultValue: Initializer<T>, options?: StoreOptions<T>) {
    const Context = createReactContext<Store<T> | null>(null)

    function useStoreInstance() {
        const store = useContext(Context)

        if (store === null) {
            throw new Error('Store context is missing a matching Provider')
        }

        return store
    }

    function Provider({ children, initialValue }: StoreProviderProps<T>) {
        const [store] = useReactState(() => {
            const resolvedDefaultValue = resolveInitializer(defaultValue)
            const resolvedInitialValue =
                initialValue === undefined
                    ? resolvedDefaultValue
                    : resolveStateUpdater(initialValue, resolvedDefaultValue)
            return new Store(resolvedInitialValue, options)
        })

        return <Context.Provider value={store}>{children}</Context.Provider>
    }

    function useValue(): T
    function useValue<S>(selector: Selector<T, S>, useOptions?: UseStoreOptions<S>): S
    function useValue<S = T>(selector?: Selector<T, S>, useOptions?: UseStoreOptions<S>) {
        return useStoreValue(
            useStoreInstance(),
            selector ?? (identity as Selector<T, S>),
            useOptions,
        )
    }

    function useState() {
        const store = useStoreInstance()
        return [useStoreValue(store), store.setState] as const
    }

    return {
        Context,
        Provider,
        useValue,
        useState,
        useStoreInstance,
    }
}
