import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { Window } from 'happy-dom'

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

const { cleanup, render } = await import('@testing-library/react')
const { NavLink } = await import('./NavLink')

describe(NavLink.name, () => {
    beforeEach(() => {
        window.history.replaceState(null, '', '/start')
    })

    afterEach(() => {
        cleanup()
        window.history.replaceState(null, '', '/start')
    })

    test('renders active classes when the target path matches the current path', () => {
        const { getByRole } = render(
            <NavLink
                activeClass={{ active: true, pending: false }}
                className="pill"
                inactiveClass="muted"
                to="/start?tab=details"
            >
                Start
            </NavLink>,
        )

        expect(getByRole('link', { name: 'Start' }).getAttribute('class')).toBe('pill active')
    })

    test('renders inactive classes when the target path does not match the current path', () => {
        const { getByRole } = render(
            <NavLink
                activeClass="active"
                className="pill"
                inactiveClass={{ muted: true }}
                to="/matches"
            >
                Matches
            </NavLink>,
        )

        expect(getByRole('link', { name: 'Matches' }).getAttribute('class')).toBe('pill muted')
    })

    test('normalizes relative targets using the current URL', () => {
        window.history.replaceState(null, '', '/matches/42')

        const { getByRole } = render(
            <NavLink activeClass="active" className="pill" inactiveClass="muted" to="?tab=details">
                Current match
            </NavLink>,
        )

        expect(getByRole('link', { name: 'Current match' }).getAttribute('class')).toBe(
            'pill active',
        )
    })
})
