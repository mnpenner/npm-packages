import { afterEach, describe, expect, test } from 'bun:test'
import type { ReactNode } from 'react'
import { Window } from 'happy-dom'

const testWindow = new Window({ url: 'http://localhost/' })

testWindow.SyntaxError = SyntaxError

Object.assign(globalThis, {
    IS_REACT_ACT_ENVIRONMENT: true,
    window: testWindow,
    document: testWindow.document,
    navigator: testWindow.navigator,
    HTMLElement: testWindow.HTMLElement,
    SyntaxError,
})

const { act } = await import('react')
const { createRoot } = await import('react-dom/client')
const { createStore, createStoreContext } = await import('./index')

const roots: Array<ReturnType<typeof createRoot>> = []

function render(children: ReactNode) {
    const container = document.createElement('div')
    document.body.append(container)

    const root = createRoot(container)
    roots.push(root)

    act(() => {
        root.render(children)
    })

    return container
}

afterEach(() => {
    for (const root of roots.splice(0)) {
        act(() => {
            root.unmount()
        })
    }

    document.body.replaceChildren()
})

describe('createStore React hook', () => {
    test('subscribes components to full and selected store values', () => {
        const store = createStore({ count: 0, label: 'zero' })

        function FullValue() {
            const state = store.useValue()
            return <span data-testid="full">{state.label}</span>
        }

        function SelectedValue() {
            const parity = store.useValue((state) => ({ value: state.count % 2 }), {
                isEqual: (a, b) => a.value === b.value,
            })

            return <span data-testid="selected">{parity.value}</span>
        }

        const container = render(
            <>
                <FullValue />
                <SelectedValue />
            </>,
        )

        expect(container.querySelector('[data-testid="full"]')?.textContent).toBe('zero')
        expect(container.querySelector('[data-testid="selected"]')?.textContent).toBe('0')

        act(() => {
            store.setState({ count: 2, label: 'two' })
        })

        expect(container.querySelector('[data-testid="full"]')?.textContent).toBe('two')
        expect(container.querySelector('[data-testid="selected"]')?.textContent).toBe('0')

        act(() => {
            store.setState({ count: 3, label: 'three' })
        })

        expect(container.querySelector('[data-testid="full"]')?.textContent).toBe('three')
        expect(container.querySelector('[data-testid="selected"]')?.textContent).toBe('1')
    })
})

describe('createStoreContext', () => {
    test('provides scoped values, setters, and store instances', () => {
        const CounterContext = createStoreContext(() => ({ count: 0, label: 'default' }))

        function Reader() {
            const count = CounterContext.useValue((state) => state.count)
            const [state, setState] = CounterContext.useState()
            const store = CounterContext.useStoreInstance()

            return (
                <>
                    <span data-testid="count">{count}</span>
                    <span data-testid="label">{state.label}</span>
                    <span data-testid="snapshot">{store.getSnapshot().count}</span>
                    <button
                        type="button"
                        onClick={() => setState((value) => ({ ...value, count: value.count + 1 }))}
                    >
                        Increment
                    </button>
                </>
            )
        }

        const container = render(
            <CounterContext.Provider
                initialValue={(state) => ({ ...state, count: 2, label: 'provided' })}
            >
                <Reader />
            </CounterContext.Provider>,
        )

        expect(container.querySelector('[data-testid="count"]')?.textContent).toBe('2')
        expect(container.querySelector('[data-testid="label"]')?.textContent).toBe('provided')
        expect(container.querySelector('[data-testid="snapshot"]')?.textContent).toBe('2')

        act(() => {
            container.querySelector('button')?.click()
        })

        expect(container.querySelector('[data-testid="count"]')?.textContent).toBe('3')
        expect(container.querySelector('[data-testid="snapshot"]')?.textContent).toBe('3')
    })

    test('throws when hooks are used outside a provider', () => {
        const CounterContext = createStoreContext({ count: 0 })

        function Reader() {
            CounterContext.useStoreInstance()
            return null
        }

        expect(() => render(<Reader />)).toThrow('Store context is missing a matching Provider')
    })
})
