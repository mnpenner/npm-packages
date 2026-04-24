#!/usr/bin/env -S bun test
import {describe, expect, it} from 'bun:test'
import {HttpMethod, HttpStatus} from '@mpen/http-helpers'
import {z} from 'zod'
import {Router} from '../router'
import {expectType} from '@mpen/server-router/testing/type-assert'
import {ValidationError, ZodRouteFactory, zodHandler, zodPartial, zodRoute} from '../helpers/zod'

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
            handler: ({req, params}) => {
                expectType<Request>(req)
                expectType<{id: string}>(params.path)
                expectType<{verbose: 'yes' | 'no'}>(params.query)
                expectType<{name: string}>(params.body)
                return new Response(JSON.stringify({
                    pathParams: params.path,
                    query: params.query,
                    body: params.body,
                }), {
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
            validateResponse: false,
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
            validateResponse: false,
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

    it('validates responses when enabled', async () => {
        const router = new Router().add({
            path: '/validate',
            method: HttpMethod.GET,
            handler: zodHandler({
                schema: {
                    response: {
                        body: {
                            200: z.object({ok: z.boolean()}),
                        },
                    },
                },
                validateResponse: true,
                handler: () => ({ok: 'nope'} as any),
            }),
        })

        const response = await router.fetch(new Request('https://example.com/validate'))

        expect(response.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR)
    })

    it('skips response validation when disabled', async () => {
        const router = new Router().add({
            path: '/skip',
            method: HttpMethod.GET,
            handler: zodHandler({
                schema: {
                    response: {
                        body: {
                            200: z.object({ok: z.boolean()}),
                        },
                    },
                },
                validateResponse: false,
                handler: () => new Response(JSON.stringify({ok: 'nope'}), {
                    headers: {'content-type': 'application/json'},
                }),
            }),
        })

        const response = await router.fetch(new Request('https://example.com/skip'))

        expect(response.status).toBe(HttpStatus.OK)
        expect(await response.json()).toEqual({ok: 'nope'})
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
            validateResponse: false,
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
            validateResponse: false,
            handler: ({params}) => new Response(params.path.id),
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

describe('ZodRouteFactory', () => {
    it('applies factory defaults and allows per-route overrides', async () => {
        const factory = new ZodRouteFactory({
            validateResponse: false,
            schema: {
                response: {
                    body: {
                        [HttpStatus.BAD_REQUEST]: z.object({message: z.string()}),
                    },
                },
            },
            validationError: () => new Response('factory bad input', {status: HttpStatus.UNPROCESSABLE_ENTITY}),
        })

        const router = new Router()
        router.add(factory.route({
            path: '/factory/:id',
            method: HttpMethod.GET,
            schema: {
                request: {
                    path: z.object({id: z.string().uuid()}),
                },
                response: {
                    body: {
                        200: z.object({ok: z.boolean()}),
                    },
                },
            },
            handler: () => new Response(JSON.stringify({ok: 'still allowed'}), {
                headers: {'content-type': 'application/json'},
            }),
        }))
        router.add(factory.route({
            path: '/factory-override',
            method: HttpMethod.GET,
            schema: {
                response: {
                    body: {
                        200: z.object({ok: z.boolean()}),
                    },
                },
            },
            validateResponse: true,
            handler: () => new Response(JSON.stringify({ok: 'invalid'}), {
                headers: {'content-type': 'application/json'},
            }),
        }))

        const invalidPathResponse = await router.fetch(new Request('https://example.com/factory/not-a-uuid'))
        expect(invalidPathResponse.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY)
        expect(await invalidPathResponse.text()).toBe('factory bad input')

        const relaxedResponse = await router.fetch(new Request('https://example.com/factory/00000000-0000-0000-0000-000000000000'))
        expect(relaxedResponse.status).toBe(HttpStatus.OK)
        expect(await relaxedResponse.json()).toEqual({ok: 'still allowed'})

        const strictResponse = await router.fetch(new Request('https://example.com/factory-override'))
        expect(strictResponse.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR)
    })

    it('merges default schemas into generated route schemas', () => {
        const factory = new ZodRouteFactory({
            schema: {
                response: {
                    body: {
                        [HttpStatus.BAD_REQUEST]: z.object({message: z.string()}),
                    },
                },
            },
        })

        const route = factory.route({
            path: '/factory-schema',
            method: HttpMethod.GET,
            schema: {
                response: {
                    body: {
                        [HttpStatus.OK]: z.object({ok: z.boolean()}),
                    },
                },
            },
            validateResponse: false,
            handler: () => new Response('ok'),
        })

        expect(route.schema?.response?.body).toEqual({
            200: {
                type: 'object',
                properties: {
                    ok: {type: 'boolean'},
                },
                required: ['ok'],
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
        })
    })
})
