import type { RouteObject } from '@mpen/rerouter'

const ROUTES: readonly RouteObject[] = [
    { name: 'home', path: '/', component: () => import('./pages/Home') },
    {
        name: 'kitchenSink',
        path: '/hello/:foo/bar/:baz/*splat/xxx{/:optional/lol/:two}',
        component: () => import('./pages/KitchenSink'),
    },
    { name: 'login', path: '/login', component: () => import('./pages/Login') },
    { name: 'match', path: '/matches/:id', component: () => import('./pages/Match') },
    { name: 'notFound', path: '*', component: () => import('./pages/NotFound') },
]

export default ROUTES
