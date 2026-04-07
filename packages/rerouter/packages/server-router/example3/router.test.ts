#!/usr/bin/env -S bun test
import {describe, expect, it} from 'bun:test'
import {HttpMethod, HttpStatus} from '@mpen/http-helpers'
import router from './router'

describe('example3 router', () => {
    it('serializes successful responses as JSON by default', async () => {
        const response = await router.fetch(new Request('https://example.com/widgets/7?view=summary', {
            method: HttpMethod.POST,
            headers: {'content-type': 'application/json'},
            body: JSON.stringify({name: 'alpha', tags: ['x', 'y']}),
        }))

        expect(response.status).toBe(HttpStatus.OK)
        expect(response.headers.get('content-type')).toBe('application/json')
        expect(await response.json()).toEqual({
            id: 7,
            name: 'alpha',
            view: 'summary',
            tags: ['x', 'y'],
            summary: 'alpha',
        })
    })

    it('serializes successful responses as YAML when requested', async () => {
        const response = await router.fetch(new Request('https://example.com/widgets/7?view=full', {
            method: HttpMethod.POST,
            headers: {
                accept: 'application/x-yaml',
                'content-type': 'application/json',
            },
            body: JSON.stringify({name: 'alpha', tags: ['x', 'y']}),
        }))

        expect(response.status).toBe(HttpStatus.OK)
        expect(response.headers.get('content-type')).toBe('application/x-yaml')
        expect(await response.text()).toContain('summary: Widget 7: alpha (2 tag(s))')
    })

    it('serializes validation errors using the same content negotiation', async () => {
        const response = await router.fetch(new Request('https://example.com/widgets/not-a-number?view=summary', {
            method: HttpMethod.POST,
            headers: {
                accept: 'application/x-yaml',
                'content-type': 'application/json',
            },
            body: JSON.stringify({name: 'alpha', tags: ['x']}),
        }))

        expect(response.status).toBe(HttpStatus.BAD_REQUEST)
        expect(response.headers.get('content-type')).toBe('application/x-yaml')
        expect(await response.text()).toContain('component: url_path')
    })
})
