import type {RouteComponent, RouteObject, RouteParams} from '../src'

function Home() {
    return <div>Home</div>
}

type KitchenSinkParams = {
    foo: string
    baz: string
    splat: string
    optional?: string
    two?: string
}

const KitchenSink: RouteComponent<KitchenSinkParams> = ({foo, baz, splat, optional, two}) => {
    return (
        <div>
            <div>foo: {foo}</div>
            <div>baz: {baz}</div>
            <div>splat: {splat}</div>
            <div>optional: {optional}</div>
            <div>two: {two}</div>
        </div>
    )
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
    {name: 'kitchenSink', pattern: '/hello/:foo/bar/:baz/*splat/xxx{/:optional/lol/:two}', component: KitchenSink},
    {name: 'login', pattern: '/login', component: Login},
    {name: 'match', pattern: '/matches/:id', component: Match},
    {name: 'notFound', pattern: '*', component: NotFound},
]

export default ROUTES
