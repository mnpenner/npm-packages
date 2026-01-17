#!/usr/bin/env -S bun test
import {describe, expect, it} from 'bun:test'
import {HttpMethod, HttpStatus} from '@mpen/http-helpers'
import {z} from 'zod'
import {Router} from '../router'
import {ValidationError, zodRoute} from './zod'
import {expectType, type TypeEqual} from '@mpen/server-router/testing/type-assert'

describe('zodRoute', () => {
    it('parses and supplies validated inputs to the handler', async () => {
        const route = zodRoute({
            pattern: '/users/:id',
            method: HttpMethod.POST,
            path: z.object({id: z.string()}),
            query: z.object({verbose: z.enum(['yes', 'no'])}),
            body: z.object({name: z.string()}),
            handler: ({req,path, query, body}) => {
                expectType<TypeEqual<typeof req, Request>>(true);
                expectType<TypeEqual<typeof path, {id:string}>>(true);
                expectType<TypeEqual<typeof query, {verbose:'yes'|'no'}>>(true);
                expectType<TypeEqual<typeof body, {name:string}>>(true);
                return new Response(JSON.stringify({path, query, body}), {
                    headers: {'content-type': 'application/json'},
                })
            },
        })

        const router = new Router().add(route)

        const response = await router.fetch(new Request('https://example.com/users/123?verbose=yes', {
            method: HttpMethod.POST,
            headers: {'content-type': 'application/json'},
            body: JSON.stringify({name: 'Ada'}),
        }))

        expect(response.status).toBe(HttpStatus.OK)
        expect(await response.json()).toEqual({
            path: {id: '123'},
            query: {verbose: 'yes'},
            body: {name: 'Ada'},
        })
    })

    it('returns a default validation error response when parsing fails', async () => {
        const route = zodRoute({
            pattern: '/users/:id',
            method: HttpMethod.POST,
            path: z.object({id: z.string()}),
            body: z.object({name: z.string()}),
            handler: () => new Response('ok'),
        })
        const router = new Router().add(route)

        const response = await router.fetch(new Request('https://example.com/users/123', {
            method: HttpMethod.POST,
            headers: {'content-type': 'application/json'},
            body: JSON.stringify({name: 123}),
        }))
        const body = await response.json()

        expect(response.status).toBe(HttpStatus.BAD_REQUEST)
        expect(body.component).toBe('request_body')
    })

    it('uses a custom validation error handler when provided', async () => {
        const route = zodRoute({
            pattern: '/users/:id',
            method: HttpMethod.GET,
            path: z.object({id: z.string().uuid()}),
            handler: () => new Response('ok'),
            validationError: (component, error) => {
                expect(component).toBe(ValidationError.URL_PATH)
                expect(error).toBeInstanceOf(z.ZodError)
                return new Response('bad input', {status: HttpStatus.UNPROCESSABLE_ENTITY})
            },
        })
        const router = new Router().add(route)

        const response = await router.fetch(new Request('https://example.com/users/not-a-uuid'))

        expect(response.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY)
    })

    it('generates OpenAPI requestBody and parameters from schemas', () => {
        const route = zodRoute({
            pattern: '/users/:id',
            method: HttpMethod.POST,
            path: z.object({id: z.string()}),
            query: z.object({verbose: z.boolean().optional()}),
            body: z.object({name: z.string()}),
            handler: () => new Response('ok'),
        })

        const openapi = route.meta?.openapi as any

        expect(openapi.requestBody.content['application/json'].schema.type).toBe('object')
        expect(openapi.parameters).toEqual([
            {name: 'verbose', in: 'query', required: false, schema: {type: 'boolean'}},
            {name: 'id', in: 'path', required: true, schema: {type: 'string'}},
        ])
    })

    it('merges generated OpenAPI metadata with existing entries', () => {
        const route = zodRoute({
            pattern: '/users/:id',
            method: HttpMethod.GET,
            path: z.object({id: z.string()}),
            meta: {
                openapi: {
                    summary: 'Get user',
                    parameters: [{name: 'include', in: 'query', schema: {type: 'string'}}],
                },
            },
            handler: () => new Response('ok'),
        })

        const openapi = route.meta?.openapi as any

        expect(openapi.summary).toBe('Get user')
        expect(openapi.parameters).toEqual([
            {name: 'include', in: 'query', schema: {type: 'string'}},
            {name: 'id', in: 'path', required: true, schema: {type: 'string'}},
        ])
    })
})
