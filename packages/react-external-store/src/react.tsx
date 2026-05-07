import {
    createContext as createReactContext,
    useContext,
    useMemo,
    useState as useReactState,
    useSyncExternalStore,
} from 'react'
import type { Context as ReactContext, ReactNode } from 'react'
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

/**
 * Options for React store value subscriptions.
 *
 * @example
 * ```ts
 * const count = store.useValue((state) => state.count, {
 *     isEqual: Object.is,
 * })
 * ```
 *
 * @typeParam S - The selected value type.
 */
export interface UseStoreOptions<S> {
    /**
     * Compares selected values before triggering a component update.
     */
    isEqual?: EqualityFn<S>
}

/**
 * External store with a React hook for reading subscribed values.
 *
 * @example
 * ```tsx
 * const store = createStore({ count: 0 })
 *
 * function Counter() {
 *     const count = store.useValue((state) => state.count)
 *     return <button onClick={() => store.setState((state) => ({ count: state.count + 1 }))}>{count}</button>
 * }
 * ```
 *
 * @typeParam T - The state value type.
 */
export interface ReactStore<T> extends Store<T> {
    /**
     * Subscribes a component to the full store value.
     *
     * @example
     * ```tsx
     * const state = store.useValue()
     * ```
     *
     * @returns The current store value.
     */
    useValue(): T

    /**
     * Subscribes a component to a selected store value.
     *
     * @example
     * ```tsx
     * const count = store.useValue((state) => state.count)
     * ```
     *
     * @param selector - Selects the value read by the component.
     * @param options - Subscription options for the selected value.
     * @returns The selected value.
     */
    useValue<S>(selector: Selector<T, S>, options?: UseStoreOptions<S>): S
}

/**
 * Props accepted by a store context provider.
 *
 * @example
 * ```tsx
 * <DraftContext.Provider initialValue={{ title: 'Untitled', body: '' }}>
 *     <Editor />
 * </DraftContext.Provider>
 * ```
 *
 * @typeParam T - The context state value type.
 */
export interface StoreProviderProps<T> {
    /**
     * React children rendered within the provider scope.
     */
    children?: ReactNode

    /**
     * Optional initial state for this provider instance.
     */
    initialValue?: StateUpdater<T>
}

/**
 * React context helpers returned by [`createStoreContext`]{@link createStoreContext}.
 *
 * @example
 * ```tsx
 * const DraftContext = createStoreContext({ title: '', body: '' })
 *
 * function TitleInput() {
 *     const title = DraftContext.useValue((state) => state.title)
 *     const [, setDraft] = DraftContext.useState()
 *     return <input value={title} onChange={(event) => setDraft((state) => ({ ...state, title: event.currentTarget.value }))} />
 * }
 * ```
 *
 * @typeParam T - The context state value type.
 */
export interface StoreContext<T> {
    /**
     * Underlying React context that stores the scoped [`Store`]{@link Store}.
     */
    Context: ReactContext<Store<T> | null>

    /**
     * Provider component that creates one store instance for a React subtree.
     *
     * @example
     * ```tsx
     * <DraftContext.Provider initialValue={{ title: 'Untitled', body: '' }}>
     *     <Editor />
     * </DraftContext.Provider>
     * ```
     *
     * @param props - Provider props.
     * @returns The rendered provider element.
     */
    Provider(props: StoreProviderProps<T>): ReactNode

    /**
     * Subscribes a component to the full context value.
     *
     * @example
     * ```tsx
     * const draft = DraftContext.useValue()
     * ```
     *
     * @returns The current context value.
     */
    useValue(): T

    /**
     * Subscribes a component to a selected context value.
     *
     * @example
     * ```tsx
     * const title = DraftContext.useValue((state) => state.title)
     * ```
     *
     * @param selector - Selects the value read by the component.
     * @param options - Subscription options for the selected value.
     * @returns The selected value.
     */
    useValue<S>(selector: Selector<T, S>, options?: UseStoreOptions<S>): S

    /**
     * Subscribes to the full context value and returns its setter.
     *
     * @example
     * ```tsx
     * const [draft, setDraft] = DraftContext.useState()
     * ```
     *
     * @returns The current context value and its [`Store.setState`]{@link Store#setState} function.
     */
    useState(): readonly [T, Store<T>['setState']]

    /**
     * Returns the scoped store instance without subscribing to its value.
     *
     * @example
     * ```tsx
     * const store = DraftContext.useStoreInstance()
     * ```
     *
     * @returns The scoped store instance.
     *
     * @experimental Not sure if it's a good idea to expose the Store instance. Should maybe be called `useStore`.
     */
    useStoreInstance(): Store<T>
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

/**
 * Creates a React-aware external store.
 *
 * @example
 * ```tsx
 * const counter = createStore({ count: 0 })
 *
 * function Counter() {
 *     const count = counter.useValue((state) => state.count)
 *     return <button onClick={() => counter.setState((state) => ({ count: state.count + 1 }))}>{count}</button>
 * }
 * ```
 *
 * @param initialValue - Initial value or lazy initializer.
 * @param options - Store behavior options.
 * @returns A [`ReactStore`]{@link ReactStore} with imperative and hook APIs.
 */
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

/**
 * Creates React context helpers for a scoped store.
 *
 * @example
 * ```tsx
 * const DraftContext = createStoreContext({ title: '', body: '' })
 *
 * function Preview() {
 *     const draft = DraftContext.useValue()
 *     return <article>{draft.title}</article>
 * }
 * ```
 *
 * @param defaultValue - Default value or lazy initializer used by each provider.
 * @param options - Store behavior options for each provider instance.
 * @returns Context helpers for reading and updating scoped state.
 */
export function createStoreContext<T>(
    defaultValue: Initializer<T>,
    options?: StoreOptions<T>,
): StoreContext<T> {
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
