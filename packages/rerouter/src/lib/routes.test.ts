import { describe, expect, test } from 'bun:test'
import { normalizeRoutes, type RouteObject } from './routes'

const loadComponent: RouteObject['component'] = async () => ({
    default: () => null,
})

describe('normalizeRoutes', () => {
    test('matches regexp params with optional groups', () => {
        const [route] = normalizeRoutes([
            {
                name: 'blogPost',
                pattern: '/blog/:id(\\d+){-:title}?',
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
})
