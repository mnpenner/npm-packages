#!/usr/bin/env -S bun test
import { describe, expect, it } from 'bun:test'
import { HttpStatus } from '@mpen/http'
import { badRequest, unprocessableContent } from './status-responses'

describe('status response helpers', () => {
    it('creates bad request responses', () => {
        const result = badRequest({ message: 'Invalid request' }, { headers: { 'x-error': '1' } })

        expect(result.status).toBe(HttpStatus.BAD_REQUEST)
        expect(result.body).toEqual({ message: 'Invalid request' })
        expect(result.headers.get('x-error')).toBe('1')
    })

    it('creates unprocessable content responses', () => {
        const result = unprocessableContent({ message: 'Email is already taken' })

        expect(result.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY)
        expect(result.body).toEqual({ message: 'Email is already taken' })
    })
})
