import type { Routes } from '@mpen/rerouter'

const loadFetchLoading = () => import('./pages/FetchLoading')

const ROUTES: Routes = [
    { name: 'home', pattern: '/', component: () => import('./pages/Home') },
    {
        name: 'kitchenSink',
        pattern: '/hello/:foo/bar/:baz/*splat/xxx{/:optional/lol/:two}',
        component: () => import('./pages/KitchenSink'),
    },
    {
        name: 'blogPost',
        pattern: '/blog/:id(\\d+){-:title}?',
        component: () => import('./pages/BlogPost'),
    },
    {
        name: 'slowLoading',
        pattern: '/slow-loading',
        component: () =>
            new Promise((resolve) => {
                setTimeout(resolve, 2000)
            }).then(() => import('./pages/SlowLoading')),
    },
    {
        name: 'fetchLoading',
        pattern: '/fetch-loading',
        component: loadFetchLoading,
    },
    {
        name: 'fetchLoadingItem',
        pattern: '/fetch-loading/:id',
        component: loadFetchLoading,
    },
    { name: 'login', pattern: '/login', component: () => import('./pages/Login') },
    { name: 'match', pattern: '/matches/:id', component: () => import('./pages/Match') },
    { name: 'notFound', pattern: '*', component: () => import('./pages/NotFound') },
]

export default ROUTES
