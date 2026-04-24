#!/usr/bin/env -S bun test
import {describe, expect, it} from 'bun:test'
import {HttpMethod} from '@mpen/http-helpers'
import {normalizeRoute} from './route-normalize'

describe('normalizeRoute', function () {
    it('builds a URLPattern and default name', function () {
        const route = normalizeRoute({
            method: HttpMethod.GET,
            path: '/users/:id',
            handler: function () {
                return new Response('ok')
            },
        })

        expect(route.path).toBeInstanceOf(URLPattern)
        expect(route.name).toEqual(['usersById'])
        expect(route.method).toBe(HttpMethod.GET)
    })

    it('normalizes accept entries into media types', function () {
        const route = normalizeRoute({
            method: HttpMethod.POST,
            path: '/upload',
            accept: ['Application/JSON; charset=UTF-8', {type: 'text/plain'}],
            handler: function () {
                return new Response('ok')
            },
        })

        expect(route.accept).toEqual([
            {type: 'application/json', charset: 'utf-8'},
            {type: 'text/plain'},
        ])
    })
})
