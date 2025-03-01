#!bun test
import { test, expect, describe, it } from 'bun:test';
import { randomBytes } from 'node:crypto';
import { OrderedTypedIdGenerator } from './OrderedTypedIdGenerator';
import { ObfuscatedIdEncoder } from './ObfuscatedIdEncoder';
import {ReadableIdEncoder} from './ReadableIdEncoder'

describe('ReadableIdEncoder', () => {
    const encoder = new ReadableIdEncoder();
    it('round-trip', () => {
        for(let i=0; i<10_000; ++i) {
            const id = new Uint8Array(randomBytes(16))
            const encoded = encoder.encode(id);
            const decoded = encoder.decode(encoded);
            expect(decoded).toEqual(id)
        }
    })
})
