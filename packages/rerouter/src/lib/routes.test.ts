import { describe, expect, test } from 'bun:test'
import { normalizeRoutes, type RouteObject } from './routes'

const loadComponent: RouteObject['component'] = async () => ({
    default: () => null,
})

describe('normalizeRoutes', () => {
    test('matches routes without names', () => {
        const [route] = normalizeRoutes([
            {
                path: '/fetch-loading/:id',
                component: loadComponent,
            },
        ])

        expect(route.name).toBeUndefined()
        expect(route.matches('/fetch-loading/abc-123')).toEqual({ id: 'abc-123' })
    })

    test('matches catch-all routes', () => {
        for (const path of ['*', '/*']) {
            const [route] = normalizeRoutes([
                {
                    path,
                    component: loadComponent,
                },
            ])

            expect(route.matches('/')).toEqual({})
            expect(route.matches('/anything')).toEqual({})
            expect(route.matches('/nested/path')).toEqual({})
        }
    })

    test('matches regexp params with optional groups', () => {
        const [route] = normalizeRoutes([
            {
                name: 'blogPost',
                path: '/blog/:id(\\d+){-:title}?',
                component: loadComponent,
            },
        ])

        expect(route.matches('/blog/123')).toEqual({ id: '123' })
        expect(route.matches('/blog/123-hello%20world')).toEqual({
            id: '123',
            title: 'hello world',
        })
        expect(route.matches('/blog/not-a-number')).toBeNull()
    })

    test('matches named wildcards', () => {
        const [route] = normalizeRoutes([
            {
                name: 'files',
                path: '/files/*path',
                component: loadComponent,
            },
        ])

        expect(route.matches('/files/docs/api')).toEqual({ path: 'docs/api' })
        expect(route.matches('/files/docs%20and%20api/reference')).toEqual({
            path: 'docs and api/reference',
        })
    })
})
