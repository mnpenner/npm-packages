#!/usr/bin/env -S bun test
import { describe, expect, it } from 'bun:test'
import { HttpMethod, HttpStatus } from '@mpen/http-helpers'
import { Router } from '../router'
import { jsonResponse } from '../response'
import { expectType } from '@mpen/ts-types'
import * as v from 'valibot'
import {
    createValibotRoutes,
    valibotHandler,
    valibotPartial,
    valibotRoute,
    ValibotValidationError,
    withValibot,
} from './valibot'
import type { ValibotValidationErrorBody } from './valibot'

describe('valibotHandler', () => {
    it('parses and supplies validated inputs to the handler', async () => {
        const handler = valibotHandler({
            schema: {
                request: {
                    path: v.object({ id: v.string() }),
                    query: v.object({ verbose: v.picklist(['yes', 'no']) }),
                    body: v.object({ name: v.string() }),
                },
                response: {
                    body: {
                        200: v.object({
                            pathParams: v.object({ id: v.string() }),
                            query: v.object({ verbose: v.picklist(['yes', 'no']) }),
                            body: v.object({ name: v.string() }),
                        }),
                    },
                },
            },
            handler: ({ req, params }) => {
                expectType<Request>(req)
                expectType<{ id: string }>(params.path)
                expectType<{ verbose: 'yes' | 'no' }>(params.query)
                expectType<{ name: string }>(params.body)
                return jsonResponse({
                    pathParams: params.path,
                    query: params.query,
                    body: params.body,
                })
            },
        })

        const router = new Router().add({
            path: '/users/:id',
            method: HttpMethod.POST,
            handler,
        })

        const response = await router.fetch(
            new Request('https://example.com/users/123?verbose=yes', {
                method: HttpMethod.POST,
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ name: 'Ada' }),
            }),
        )

        expect(response.status).toBe(HttpStatus.OK)
        expect(await response.json()).toEqual({
            pathParams: { id: '123' },
            query: { verbose: 'yes' },
            body: { name: 'Ada' },
        })
    })

    it('returns a default validation error response when parsing fails', async () => {
        const handler = valibotHandler({
            schema: {
                request: {
                    path: v.object({ id: v.string() }),
                    body: v.object({ name: v.string() }),
                },
            },
            validateResponse: false,
            handler: () => jsonResponse({ id: '1', name: 'Ada' }),
        })
        const router = new Router().add({
            path: '/users/:id',
            method: HttpMethod.POST,
            handler,
        })

        const response = await router.fetch(
            new Request('https://example.com/users/123', {
                method: HttpMethod.POST,
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ name: 123 }),
            }),
        )
        const body = (await response.json()) as ValibotValidationErrorBody

        expect(response.status).toBe(HttpStatus.BAD_REQUEST)
        expect(body.component).toBe('request_body')
        expect(Array.isArray(body.issues)).toBe(true)
    })

    it('uses a custom validation error handler when provided', async () => {
        const handler = valibotHandler({
            schema: {
                request: {
                    path: v.object({ id: v.pipe(v.string(), v.uuid()) }),
                },
            },
            validateResponse: false,
            handler: () => jsonResponse({ id: '1', name: 'Ada' }),
            validationError: (component, issues) => {
                expect(component).toBe(ValibotValidationError.URL_PATH)
                expect(issues.length).toBeGreaterThan(0)
                return new Response('bad input', { status: HttpStatus.UNPROCESSABLE_ENTITY })
            },
        })
        const router = new Router().add({
            path: '/users/:id',
            method: HttpMethod.GET,
            handler,
        })

        const response = await router.fetch(new Request('https://example.com/users/not-a-uuid'))

        expect(response.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY)
    })

    it('validates responses when enabled', async () => {
        const router = new Router().add({
            path: '/validate',
            method: HttpMethod.GET,
            handler: valibotHandler({
                schema: {
                    response: {
                        body: {
                            200: v.object({ ok: v.boolean() }),
                        },
                    },
                },
                validateResponse: true,
                handler: () => ({ ok: 'nope' }) as any,
            }),
        })

        const response = await router.fetch(new Request('https://example.com/validate'))

        expect(response.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR)
    })
})

describe('valibotPartial', () => {
    it('returns a handler and generated route schema', () => {
        const partial = valibotPartial({
            schema: {
                request: {
                    path: v.object({ id: v.string() }),
                    query: v.object({ verbose: v.optional(v.boolean()) }),
                    body: v.object({ name: v.string() }),
                },
                response: {
                    body: {
                        200: v.object({ id: v.string(), name: v.string() }),
                        400: v.object({ message: v.string() }),
                    },
                },
            },
            validateResponse: false,
            handler: () => jsonResponse({ id: '1', name: 'Ada' }),
        })

        expect(typeof partial.handler).toBe('function')
        expect(partial.schema?.request?.path).toEqual({
            type: 'object',
            properties: {
                id: { type: 'string' },
            },
            required: ['id'],
        })
        expect(partial.schema?.response?.body?.[200]).toEqual({
            type: 'object',
            properties: {
                id: { type: 'string' },
                name: { type: 'string' },
            },
            required: ['id', 'name'],
        })
    })
})

describe('valibotRoute', () => {
    it('returns a full route with a validated handler and generated schema', () => {
        const route = valibotRoute({
            path: '/users/:id',
            method: HttpMethod.GET,
            schema: {
                request: {
                    path: v.object({ id: v.string() }),
                },
                response: {
                    body: {
                        200: v.object({ id: v.string() }),
                    },
                },
            },
            validateResponse: false,
            handler: ({ params }) => jsonResponse({ id: params.path.id }),
        })

        expect(route.path).toBe('/users/:id')
        expect(route.schema?.request?.path).toEqual({
            type: 'object',
            properties: {
                id: { type: 'string' },
            },
            required: ['id'],
        })
    })
})

describe('withValibot', () => {
    it('returns route options for method-specific router helpers', async () => {
        const router = new Router()
        router.post(
            '/users/:id',
            withValibot({
                name: 'user.update',
                schema: {
                    request: {
                        path: v.object({
                            id: v.pipe(
                                v.string(),
                                v.transform((value) => Number(value)),
                                v.integer(),
                            ),
                        }),
                        body: v.object({ name: v.string() }),
                    },
                    response: {
                        body: {
                            200: v.object({ id: v.number(), name: v.string() }),
                        },
                    },
                },
                validateResponse: true,
                handler: ({ params }) =>
                    jsonResponse({ id: params.path.id, name: params.body.name }),
            }),
        )

        const response = await router.fetch(
            new Request('https://example.com/users/123', {
                method: HttpMethod.POST,
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ name: 'Ada' }),
            }),
        )

        expect(response.status).toBe(HttpStatus.OK)
        expect(await response.json()).toEqual({ id: 123, name: 'Ada' })
        expect(router.getRoutes()[0]?.name).toEqual(['user', 'update'])
        expect(router.getRoutes()[0]?.method).toBe(HttpMethod.POST)
    })
})

describe('createValibotRoutes', () => {
    it('applies shared defaults and allows per-route overrides', async () => {
        const valibotRouteBuilder = createValibotRoutes({
            validateResponse: false,
            schema: {
                response: {
                    body: {
                        [HttpStatus.BAD_REQUEST]: v.object({ message: v.string() }),
                    },
                },
            },
            validationError: () =>
                new Response('builder bad input', { status: HttpStatus.UNPROCESSABLE_ENTITY }),
        })

        const router = new Router()
        router.get(
            '/builder/:id',
            valibotRouteBuilder({
                schema: {
                    request: {
                        path: v.object({ id: v.pipe(v.string(), v.uuid()) }),
                    },
                    response: {
                        body: {
                            200: v.object({ ok: v.boolean() }),
                        },
                    },
                },
                handler: () =>
                    new Response(JSON.stringify({ ok: 'still allowed' }), {
                        headers: { 'content-type': 'application/json' },
                    }),
            }),
        )
        router.get(
            '/builder-override',
            valibotRouteBuilder({
                schema: {
                    response: {
                        body: {
                            200: v.object({ ok: v.boolean() }),
                        },
                    },
                },
                validateResponse: true,
                handler: () =>
                    new Response(JSON.stringify({ ok: 'invalid' }), {
                        headers: { 'content-type': 'application/json' },
                    }),
            }),
        )

        const invalidPathResponse = await router.fetch(
            new Request('https://example.com/builder/not-a-uuid'),
        )
        expect(invalidPathResponse.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY)
        expect(await invalidPathResponse.text()).toBe('builder bad input')

        const relaxedResponse = await router.fetch(
            new Request('https://example.com/builder/00000000-0000-0000-0000-000000000000'),
        )
        expect(relaxedResponse.status).toBe(HttpStatus.OK)
        expect(await relaxedResponse.json()).toEqual({ ok: 'still allowed' })

        const strictResponse = await router.fetch(
            new Request('https://example.com/builder-override'),
        )
        expect(strictResponse.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR)
    })
})
