#!/usr/bin/env -S bun test
import {describe, expect, it} from 'bun:test'
import {HttpMethod, HttpStatus} from '@mpen/http-helpers'
import {z} from 'zod'
import {Router} from '../router'
import {expectType} from '@mpen/server-router/testing/type-assert'
import {ValidationError, zodHandler, zodPartial, zodRoute} from '../helpers/zod'

describe('zodHandler', () => {
    it('parses and supplies validated inputs to the handler', async () => {
        const handler = zodHandler({
            schema: {
                request: {
                    path: z.object({id: z.string()}),
                    query: z.object({verbose: z.enum(['yes', 'no'])}),
                    body: z.object({name: z.string()}),
                },
                response: {
                    body: {
                        200: z.object({
                            pathParams: z.object({id: z.string()}),
                            query: z.object({verbose: z.enum(['yes', 'no'])}),
                            body: z.object({name: z.string()}),
                        }),
                    },
                },
            },
            handler: ({req, pathParams, query, body}) => {
                expectType<Request>(req)
                expectType<{id: string}>(pathParams)
                expectType<{verbose: 'yes' | 'no'}>(query)
                expectType<{name: string}>(body)
                return new Response(JSON.stringify({pathParams, query, body}), {
                    headers: {'content-type': 'application/json'},
                })
            },
        })

        const router = new Router().add({
            path: '/users/:id',
            method: HttpMethod.POST,
            handler,
        })

        const response = await router.fetch(new Request('https://example.com/users/123?verbose=yes', {
            method: HttpMethod.POST,
            headers: {'content-type': 'application/json'},
            body: JSON.stringify({name: 'Ada'}),
        }))

        expect(response.status).toBe(HttpStatus.OK)
        expect(await response.json()).toEqual({
            pathParams: {id: '123'},
            query: {verbose: 'yes'},
            body: {name: 'Ada'},
        })
    })

    it('returns a default validation error response when parsing fails', async () => {
        const handler = zodHandler({
            schema: {
                request: {
                    path: z.object({id: z.string()}),
                    body: z.object({name: z.string()}),
                },
            },
            handler: () => new Response('ok'),
        })
        const router = new Router().add({
            path: '/users/:id',
            method: HttpMethod.POST,
            handler,
        })

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
        const handler = zodHandler({
            schema: {
                request: {
                    path: z.object({id: z.string().uuid()}),
                },
            },
            handler: () => new Response('ok'),
            validationError: (component, error) => {
                expect(component).toBe(ValidationError.URL_PATH)
                expect(error).toBeInstanceOf(z.ZodError)
                return new Response('bad input', {status: HttpStatus.UNPROCESSABLE_ENTITY})
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
})

describe('zodPartial', () => {
    it('returns a handler and generated route schema', () => {
        const partial = zodPartial({
            schema: {
                request: {
                    path: z.object({id: z.string()}),
                    query: z.object({verbose: z.boolean().optional()}),
                    body: z.object({name: z.string()}),
                },
                response: {
                    body: {
                        200: z.object({id: z.string(), name: z.string()}),
                        400: z.object({message: z.string()}),
                    },
                },
            },
            handler: () => new Response('ok'),
        })

        expect(typeof partial.handler).toBe('function')
        expect(partial.schema).toEqual({
            request: {
                path: {
                    type: 'object',
                    properties: {
                        id: {type: 'string'},
                    },
                    required: ['id'],
                    additionalProperties: false,
                },
                query: {
                    type: 'object',
                    properties: {
                        verbose: {type: 'boolean'},
                    },
                    additionalProperties: false,
                },
                body: {
                    type: 'object',
                    properties: {
                        name: {type: 'string'},
                    },
                    required: ['name'],
                    additionalProperties: false,
                },
            },
            response: {
                body: {
                    200: {
                        type: 'object',
                        properties: {
                            id: {type: 'string'},
                            name: {type: 'string'},
                        },
                        required: ['id', 'name'],
                        additionalProperties: false,
                    },
                    400: {
                        type: 'object',
                        properties: {
                            message: {type: 'string'},
                        },
                        required: ['message'],
                        additionalProperties: false,
                    },
                },
            },
        })
    })
})

describe('zodRoute', () => {
    it('returns a full route with a validated handler and generated schema', () => {
        const route = zodRoute({
            path: '/users/:id',
            method: HttpMethod.GET,
            schema: {
                request: {
                    path: z.object({id: z.string()}),
                },
                response: {
                    body: {
                        200: z.object({id: z.string()}),
                    },
                },
            },
            handler: ({pathParams}) => new Response(pathParams.id),
        })

        expect(route.path).toBe('/users/:id')
        expect(route.schema?.request?.path).toEqual({
            type: 'object',
            properties: {
                id: {type: 'string'},
            },
            required: ['id'],
            additionalProperties: false,
        })
    })
})
