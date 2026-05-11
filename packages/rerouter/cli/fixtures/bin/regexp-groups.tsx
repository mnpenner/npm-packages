import type { RouteObject } from '@mpen/rerouter'

const ROUTES: readonly RouteObject[] = [
    {
        name: 'blogPost',
        path: '/blog/:id(\\d+){-:title}?',
        component: () => import('./pages/Match'),
    },
]

export default ROUTES
