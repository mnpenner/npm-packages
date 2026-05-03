# @mpen/react-global-state

Small external state stores with optional React bindings and localStorage persistence.

The base store does not depend on React. Use `@mpen/react-global-state/react` only when you want hooks or context-scoped stores.

## Install

```sh
bun add @mpen/react-global-state
```

## Store

```ts
import { createStore } from '@mpen/react-global-state'

const counter = createStore({ count: 0 })

const unsubscribe = counter.subscribe((state, previousState) => {
    console.log(previousState.count, '->', state.count)
})

counter.setState((state) => ({
    count: state.count + 1,
}))

counter.set({ count: 10 })

console.log(counter.get())

unsubscribe()
```

Use `subscribeSelector` when code outside React only cares about part of the state.

```ts
const unsubscribe = counter.subscribeSelector(
    (state) => state.count,
    (count) => {
        console.log('count changed:', count)
    },
    { fireImmediately: true },
)
```

## React

```tsx
import { createReactStore } from '@mpen/react-global-state/react'

const session = createReactStore({
    userId: null as string | null,
    theme: 'system' as 'light' | 'dark' | 'system',
})

export function ThemeButton() {
    const theme = session.use((state) => state.theme)

    return (
        <button
            type="button"
            onClick={() => {
                session.setState((state) => ({
                    ...state,
                    theme: state.theme === 'dark' ? 'light' : 'dark',
                }))
            }}
        >
            {theme}
        </button>
    )
}

session.setState((state) => ({
    ...state,
    userId: 'user_123',
}))
```

You can also use an existing store with `useStore`.

```tsx
import { createStore } from '@mpen/react-global-state'
import { useStore } from '@mpen/react-global-state/react'

const counter = createStore({ count: 0 })

export function Counter() {
    const count = useStore(counter, (state) => state.count)

    return (
        <button
            type="button"
            onClick={() => counter.setState((state) => ({ count: state.count + 1 }))}
        >
            {count}
        </button>
    )
}
```

## localStorage

```ts
import { createLocalStorageStore } from '@mpen/react-global-state'

const settings = createLocalStorageStore('app.settings', {
    theme: 'system' as 'light' | 'dark' | 'system',
    sidebarOpen: true,
})

settings.setState((state) => ({
    ...state,
    sidebarOpen: !state.sidebarOpen,
}))
```

By default values are serialized with `JSON.stringify` and restored with `JSON.parse`. Storage failures are ignored unless you pass `onError`.

```ts
const settings = createLocalStorageStore(
    'app.settings',
    { theme: 'system' },
    {
        onError(error, operation) {
            console.warn(`Could not ${operation} settings`, error)
        },
    },
)
```

## Context

Use `createStoreContext` when state should be scoped to a React subtree instead of global module state.

```tsx
import { createStoreContext } from '@mpen/react-global-state/react'

const DraftContext = createStoreContext({
    title: '',
    body: '',
})

export function DraftEditor() {
    return (
        <DraftContext.Provider initialValue={{ title: 'Untitled', body: '' }}>
            <TitleInput />
            <Preview />
        </DraftContext.Provider>
    )
}

function TitleInput() {
    const title = DraftContext.use((state) => state.title)
    const setDraft = DraftContext.useSetState()

    return (
        <input
            value={title}
            onChange={(event) => {
                setDraft((state) => ({
                    ...state,
                    title: event.currentTarget.value,
                }))
            }}
        />
    )
}

function Preview() {
    const draft = DraftContext.use()

    return <article>{draft.title}</article>
}
```

## API

- `createStore(initialValue, options?)`
- `createLocalStorageStore(key, initialValue, options?)`
- `Store`
- `store.get()` / `store.getSnapshot()`
- `store.set(valueOrUpdater)` / `store.setState(valueOrUpdater)`
- `store.subscribe(listener, options?)`
- `store.subscribeSelector(selector, listener, options?)`
- `useStore(store, selector?, options?)` from `@mpen/react-global-state/react`
- `createReactStore(initialValue, options?)` from `@mpen/react-global-state/react`
- `createStoreContext(defaultValue, options?)` from `@mpen/react-global-state/react`
