#!/usr/bin/env -S bun test
import {describe, expect, it} from 'bun:test'
import {HttpMethod} from '@mpen/http-helpers'
import {Router} from '../router'
import {openapi} from '../response/openapi'
import {zodRoute} from '../routes/zod'
import {z} from 'zod'

describe('openapi', () => {
    it('consumes OpenAPI metadata from zodRoute', async () => {
        const router = new Router()
        router.add(zodRoute({
            pattern: '/users/:id',
            method: HttpMethod.POST,
            pathParams: z.object({id: z.string()}),
            query: z.object({include: z.string()}),
            body: z.object({name: z.string()}),
            handler: () => new Response('ok'),
        }))

        router.add({
            pattern: '/swagger.json',
            method: HttpMethod.GET,
            handler: openapi({
                info: {title: 'Example API', version: '1.0.0'},
            }),
        })

        const response = await router.fetch(new Request('https://example.com/swagger.json'))
        const document = await response.json()
        const operation = document.paths['/users/{id}'].post

        expect(operation.requestBody.content['application/json'].schema.type).toBe('object')
        expect(operation.requestBody.content['application/json'].schema.properties.name.type).toBe('string')
        expect(operation.parameters).toEqual(expect.arrayContaining([
            expect.objectContaining({name: 'id', in: 'path'}),
            expect.objectContaining({name: 'include', in: 'query'}),
        ]))
    })
})
