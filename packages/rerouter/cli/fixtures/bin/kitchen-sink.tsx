import type { RouteObject } from '@mpen/rerouter'

const ROUTES: readonly RouteObject[] = [
    { name: 'home', pattern: '/', component: () => import('./pages/Home') },
    {
        name: 'kitchenSink',
        pattern: '/hello/:foo/bar/:baz/*splat/xxx{/:optional/lol/:two}',
        component: () => import('./pages/KitchenSink'),
    },
    { name: 'login', pattern: '/login', component: () => import('./pages/Login') },
    { name: 'match', pattern: '/matches/:id', component: () => import('./pages/Match') },
    { name: 'notFound', pattern: '*', component: () => import('./pages/NotFound') },
]

export default ROUTES
