import type { RouteObject } from '@mpen/rerouter'

const ROUTES: readonly RouteObject[] = [
    {
        name: 'blogPost',
        pattern: '/blog/:id(\\d+){-:title}?',
        component: () => import('./pages/Match'),
    },
]

export default ROUTES
