#!/usr/bin/env -S bun test
import {describe, expect, it} from 'bun:test'
import {HttpMethod} from '@mpen/http-helpers'
import {normalizeRoute} from './route-normalize'

describe('normalizeRoute', function () {
    it('builds a URLPattern and default name', function () {
        const route = normalizeRoute({
            method: HttpMethod.GET,
            pattern: '/users/:id',
            handler: function () {
                return new Response('ok')
            },
        })

        expect(route.pattern).toBeInstanceOf(URLPattern)
        expect(route.name).toEqual(['usersById'])
        expect(route.method).toBe(HttpMethod.GET)
    })

    it('normalizes accept entries into media types', function () {
        const route = normalizeRoute({
            method: HttpMethod.POST,
            pattern: '/upload',
            accept: ['Application/JSON; charset=UTF-8', {type: 'text/plain'}],
            handler: function () {
                return new Response('ok')
            },
        })

        expect(route.accept).toEqual([
            {type: 'application/json', charset: 'UTF-8'},
            {type: 'text/plain'},
        ])
    })
})
