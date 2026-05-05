import type { RouteObject } from '@mpen/react-router'

function RouteComponent() {
    return null
}

const ROUTES: readonly RouteObject[] = [
    { name: 'home', pattern: '/', component: RouteComponent },
    {
        name: 'kitchenSink',
        pattern: '/hello/:foo/bar/:baz/*splat/xxx{/:optional/lol/:two}',
        component: RouteComponent,
    },
    { name: 'login', pattern: '/login', component: RouteComponent },
    { name: 'match', pattern: '/matches/:id', component: RouteComponent },
    { name: 'notFound', pattern: '*', component: RouteComponent },
]

export default ROUTES
