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

const { cleanup, fireEvent, render, screen } = await import('@testing-library/react')
const { Link } = await import('./Link')

describe(Link.name, () => {
    beforeEach(() => {
        window.history.replaceState(null, '', '/start')
    })

    afterEach(() => {
        cleanup()
        window.history.replaceState(null, '', '/start')
    })

    test('renders a link with merged search params', () => {
        render(
            <Link
                aria-label="Match details"
                className="match-link"
                to="/matches?sort=asc"
                search={{ page: 2, sort: 'desc' }}
            >
                View match
            </Link>,
        )

        const link = screen.getByRole('link', { name: 'Match details' })

        expect(link.textContent).toBe('View match')
        expect(link.getAttribute('class')).toBe('match-link')
        expect(link.getAttribute('href')).toBe('/matches?sort=desc&page=2')
    })

    test('pushes the target URL and emits popstate on ordinary clicks', () => {
        let popstateCount = 0
        window.addEventListener(
            'popstate',
            () => {
                popstateCount += 1
            },
            { once: true },
        )

        render(<Link to="/matches/42?tab=details">View match</Link>)

        fireEvent.click(screen.getByRole('link', { name: 'View match' }))

        expect(window.location.pathname).toBe('/matches/42')
        expect(window.location.search).toBe('?tab=details')
        expect(popstateCount).toBe(1)
    })

    test('replaces the current URL when replace is set', () => {
        const replaceState = window.history.replaceState.bind(window.history)
        let replacedUrl = ''
        window.history.replaceState = ((data, title, url) => {
            replacedUrl = String(url)
            return replaceState(data, title, url)
        }) as History['replaceState']

        render(
            <Link replace to="/matches/42">
                Replace match
            </Link>,
        )

        try {
            fireEvent.click(screen.getByRole('link', { name: 'Replace match' }))

            expect(replacedUrl).toBe('/matches/42')
            expect(window.location.pathname).toBe('/matches/42')
        } finally {
            window.history.replaceState = replaceState
        }
    })

    test('leaves modified clicks to the browser', () => {
        let popstateCount = 0
        window.addEventListener(
            'popstate',
            () => {
                popstateCount += 1
            },
            { once: true },
        )

        render(<Link to="/matches/42">Open elsewhere</Link>)

        const defaultWasNotPrevented = fireEvent.click(
            screen.getByRole('link', { name: 'Open elsewhere' }),
            { ctrlKey: true },
        )

        expect(defaultWasNotPrevented).toBe(true)
        expect(popstateCount).toBe(0)
    })

    test('leaves non-primary button clicks to the browser', () => {
        let popstateCount = 0
        window.addEventListener(
            'popstate',
            () => {
                popstateCount += 1
            },
            { once: true },
        )

        render(<Link to="/matches/42">Open with auxiliary button</Link>)

        const defaultWasNotPrevented = fireEvent.click(
            screen.getByRole('link', { name: 'Open with auxiliary button' }),
            { button: 1 },
        )

        expect(defaultWasNotPrevented).toBe(true)
        expect(popstateCount).toBe(0)
    })
})
