import type {RouteObject, RouteParams} from '../src'

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

const ROUTES: readonly RouteObject[] = [
    {name: 'home', pattern: '/', component: Home},
    {name: 'kitchenSink', pattern: '/hello/:foo/bar/:baz/*splat/xxx{/:optional/lol/:two}', component: Home},
    {name: 'login', pattern: '/login', component: Login},
    {name: 'match', pattern: '/matches/:id', component: Match},
    {name: 'notFound', pattern: '*', component: NotFound},
]

export default ROUTES
