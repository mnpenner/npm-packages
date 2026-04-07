#!/usr/bin/env -S bun test
import {describe, expect, it} from 'bun:test'
import {HttpMethod} from '@mpen/http-helpers'
import {Router} from '../router'
import {openapi} from '../plugins/openapi'

describe('openapi', () => {
    it('builds OpenAPI paths from route schemas and metadata', async () => {
        const router = new Router()
        router.add({
            path: '/users/:id',
            method: HttpMethod.GET,
            schema: {
                request: {
                    path: {
                        type: 'object',
                        properties: {
                            id: {type: 'string'},
                        },
                        required: ['id'],
                    },
                },
                response: {
                    body: {
                        200: {
                            type: 'object',
                            properties: {
                                id: {type: 'string'},
                                email: {type: 'string', format: 'email'},
                            },
                            required: ['id', 'email'],
                        },
                    },
                },
            },
            meta: {
                openapi: {
                    summary: 'Get user',
                    responses: {
                        404: {description: 'Not found'},
                    },
                },
            },
            handler: () => new Response('ok'),
        })

        router.add({
            path: '/swagger.json',
            method: HttpMethod.GET,
            handler: openapi({
                info: {
                    title: 'Example API',
                    version: '1.0.0',
                    description: 'Demo API',
                },
                servers: [{url: 'https://api.example.com'}],
                components: {
                    schemas: {
                        User: {
                            type: 'object',
                            required: ['id', 'email'],
                            properties: {
                                id: {type: 'string'},
                                email: {type: 'string', format: 'email'},
                            },
                        },
                    },
                },
                security: [{bearerAuth: []}],
            }),
        })

        const response = await router.fetch(new Request('https://example.com/swagger.json'))
        const document = await response.json()

        expect(document.openapi).toBe('3.0.3')
        expect(document.info).toEqual({
            title: 'Example API',
            version: '1.0.0',
            description: 'Demo API',
        })
        expect(document.servers).toEqual([{url: 'https://api.example.com'}])
        expect(document.paths['/users/{id}'].get.summary).toBe('Get user')
        expect(document.paths['/users/{id}'].get.responses['200'].description).toBe('OK')
        expect(document.paths['/users/{id}'].get.parameters).toEqual([
            {
                name: 'id',
                in: 'path',
                required: true,
                schema: {type: 'string'},
            },
        ])
        expect(document.components.schemas.User.properties.email.format).toBe('email')
        expect(document.security).toEqual([{bearerAuth: []}])
    })

})
