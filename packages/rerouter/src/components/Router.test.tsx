import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { Window } from 'happy-dom'
import type { RouteObject } from '../lib/routes'

const testWindow = new Window({ url: 'http://localhost/start' })

testWindow.SyntaxError = SyntaxError

Object.assign(globalThis, {
    window: testWindow,
    document: testWindow.document,
    navigator: testWindow.navigator,
    location: testWindow.location,
    history: testWindow.history,
    Event: testWindow.Event,
    HTMLElement: testWindow.HTMLElement,
    MouseEvent: testWindow.MouseEvent,
    Node: testWindow.Node,
    PopStateEvent: testWindow.PopStateEvent,
    SyntaxError,
    getComputedStyle: testWindow.getComputedStyle.bind(testWindow),
})

const { act, cleanup, render, waitFor } = await import('@testing-library/react')
const { Router } = await import('./Router')
const { pushUrl } = await import('../lib/url')

function wait(ms: number): Promise<void> {
    return new Promise((resolve) => {
        setTimeout(resolve, ms)
    })
}

describe(Router.name, () => {
    beforeEach(() => {
        window.history.replaceState(null, '', '/start')
    })

    afterEach(() => {
        cleanup()
        window.history.replaceState(null, '', '/start')
    })

    test('delays the loading fallback while a route component is loading', async () => {
        window.history.replaceState(null, '', '/slow')

        const routes: readonly RouteObject[] = [
            {
                pattern: '/slow',
                component: () =>
                    new Promise(() => {
                        // Keep the route pending so the fallback delay is observable.
                    }),
            },
        ]

        const view = render(
            <Router loading={<div>Loading route...</div>} loadingDelayMs={25} routes={routes} />,
        )

        expect(view.queryByText('Loading route...')).toBeNull()

        await act(async () => {
            await wait(30)
        })

        expect(view.getByText('Loading route...')).toBeTruthy()
    })

    test('does not show the loading fallback when the route loads before the delay', async () => {
        window.history.replaceState(null, '', '/quick')

        const routes: readonly RouteObject[] = [
            {
                pattern: '/quick',
                component: () =>
                    wait(5).then(() => ({
                        default: function QuickRoute() {
                            return <div>Quick route</div>
                        },
                    })),
            },
        ]

        const view = render(
            <Router loading={<div>Loading route...</div>} loadingDelayMs={50} routes={routes} />,
        )

        expect(view.queryByText('Loading route...')).toBeNull()

        await waitFor(() => {
            expect(view.getByText('Quick route')).toBeTruthy()
        })

        expect(view.queryByText('Loading route...')).toBeNull()
    })

    test('keeps the current route visible until a slow next route reaches the delay', async () => {
        const routes: readonly RouteObject[] = [
            {
                pattern: '/start',
                component: async () => ({
                    default: function StartRoute() {
                        return <div>Start route</div>
                    },
                }),
            },
            {
                pattern: '/slow',
                component: () =>
                    new Promise(() => {
                        // Keep the next route pending so the delayed loading state is observable.
                    }),
            },
        ]

        const view = render(
            <Router loading={<div>Loading route...</div>} loadingDelayMs={25} routes={routes} />,
        )

        await waitFor(() => {
            expect(view.getByText('Start route')).toBeTruthy()
        })

        act(() => {
            pushUrl('/slow')
        })

        expect(view.getByText('Start route')).toBeTruthy()
        expect(view.queryByText('Loading route...')).toBeNull()

        await act(async () => {
            await wait(30)
        })

        expect(view.queryByText('Start route')).toBeNull()
        expect(view.getByText('Loading route...')).toBeTruthy()
    })

    test('keeps the current route visible until a quick next route is ready', async () => {
        const routes: readonly RouteObject[] = [
            {
                pattern: '/start',
                component: async () => ({
                    default: function StartRoute() {
                        return <div>Start route</div>
                    },
                }),
            },
            {
                pattern: '/quick',
                component: () =>
                    wait(5).then(() => ({
                        default: function QuickRoute() {
                            return <div>Quick route</div>
                        },
                    })),
            },
        ]

        const view = render(
            <Router loading={<div>Loading route...</div>} loadingDelayMs={50} routes={routes} />,
        )

        await waitFor(() => {
            expect(view.getByText('Start route')).toBeTruthy()
        })

        act(() => {
            pushUrl('/quick')
        })

        expect(view.getByText('Start route')).toBeTruthy()
        expect(view.queryByText('Loading route...')).toBeNull()

        await waitFor(() => {
            expect(view.getByText('Quick route')).toBeTruthy()
        })

        expect(view.queryByText('Start route')).toBeNull()
        expect(view.queryByText('Loading route...')).toBeNull()
    })
})
