import {Router, type Route, type RouteParams} from '../src'

function Home() {
    return <div>Home</div>
}

function Login() {
    return <div>Login</div>
}

function Match({id}: RouteParams) {
    return <div>Match: {id}</div>
}

function NotFound() {
    return <div>Not found</div>
}

export const ROUTES: readonly Route[] = [
    ['/', Home],
    ['/login', Login],
    ['/matches/:id', Match],
    ['*', NotFound],
]

export function Layout() {
    return (
        <div>
            <h1>My App</h1>
            <Router routes={ROUTES} />
        </div>
    )
}

