import type { Routes } from '@mpen/rerouter'

const loadFetchLoading = () => import('./pages/FetchLoading')

const ROUTES: Routes = [
    { name: 'home', path: '/', component: () => import('./pages/Home') },
    {
        name: 'kitchenSink',
        path: '/hello/:foo/bar/:baz/*splat/xxx{/:optional/lol/:two}',
        component: () => import('./pages/KitchenSink'),
    },
    {
        name: 'blogPost',
        path: '/blog/:id(\\d+){-:title}?',
        component: () => import('./pages/BlogPost'),
    },
    {
        name: 'slowLoading',
        path: '/slow-loading',
        component: () =>
            new Promise((resolve) => {
                setTimeout(resolve, 2000)
            }).then(() => import('./pages/SlowLoading')),
    },
    {
        name: 'fetchLoading',
        path: '/fetch-loading',
        component: loadFetchLoading,
    },
    {
        name: 'fetchLoadingItem',
        path: '/fetch-loading/:id',
        component: loadFetchLoading,
    },
    { name: 'login', path: '/login', component: () => import('./pages/Login') },
    { name: 'match', path: '/matches/:id', component: () => import('./pages/Match') },
    { name: 'notFound', path: '*', component: () => import('./pages/NotFound') },
]

export default ROUTES
