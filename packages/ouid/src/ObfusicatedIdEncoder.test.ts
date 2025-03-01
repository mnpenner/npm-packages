#!bun test
import { test, expect, describe, it } from 'bun:test';
import { randomBytes } from 'node:crypto';
import { OrderedTypedIdGenerator } from './OrderedTypedIdGenerator';
import { ObfusicatedIdEncoder } from './ObfusicatedIdEncoder';
import {ReadableIdEncoder} from './ReadableIdEncoder'

const enum IdType {
    USER,
    COMMENT,
    POST,
}

describe('TypedIdGenerator and ObfusicatedIdEncoder', () => {
    const secretKey = randomBytes(16);
    const alphabet = Array.from('0123456789bcdfghjklmnpqrstvwxzBCDFGHJKLMNPQRSTVWXZ').sort(()=>Math.random()-.5).join('');
    const generator = new OrderedTypedIdGenerator<IdType>();
    const encoder = new ObfusicatedIdEncoder(secretKey, alphabet);

    describe('Basic Functionality', () => {
        it('should have correct max length for base-50', () => {
            expect(encoder.encodedLength).toBe(23);
        });

        it('should generate 16-byte IDs', () => {
            const id = generator.generate(IdType.POST);
            expect(id).toBeInstanceOf(Uint8Array);
            expect(id.length).toBe(16);
        });

        it('should format IDs to correct length', () => {
            const id = generator.generate(IdType.POST);
            const formatted = encoder.encode(id);
            expect(typeof formatted).toBe('string');
            expect(formatted.length).toBe(23);
        });

        it('should round-trip IDs correctly', () => {
            const id = generator.generate(IdType.POST);
            const formatted = encoder.encode(id);
            const parsed = encoder.decode(formatted);
            expect(parsed).toEqual(id);
        });

        it('should preserve type across all enum values', () => {
            for (const type of [IdType.USER, IdType.COMMENT, IdType.POST]) {
                const id = generator.generate(type);
                const formatted = encoder.encode(id);
                const parsed = encoder.decode(formatted);
                expect(generator.extractType(parsed)).toBe(type);
            }
        });

        it('should round-trip random bytes correctly', () => {
            for(let i=0; i<10_000; ++i) {
                const id = new Uint8Array(randomBytes(16))
                const encoded = encoder.encode(id);
                const decoded = encoder.decode(encoded);
                expect(decoded).toEqual(id)
            }
        })
    });

    describe('Uniqueness and Monotonicity', () => {
        it('should generate unique formatted IDs', () => {
            const ids = new Set<string>();
            const iterations = 10_000;
            for (let i = 0; i < iterations; i++) {
                const id = generator.generate(IdType.POST);
                const formatted = encoder.encode(id);
                expect(ids.has(formatted)).toBeFalse();
                ids.add(formatted);
            }
            expect(ids.size).toBe(iterations);
        });

        it('should maintain monotonic timestamps', () => {
            let lastTime = 1740818787459180400n
            for (let i = 0; i < 100; i++) {
                const id = generator.generate(IdType.COMMENT);
                const time = generator.extractTimeNs(id)
                expect(time).toBeGreaterThan(lastTime)
                lastTime = time
            }
        });
    });

    describe('Edge Cases', () => {
        it('should handle max type value', () => {
            const id = generator.generate(0xFFF as IdType);
            expect(generator.extractType(id)).toBe(0xFFF as IdType);
            const formatted = encoder.encode(id);
            const parsed = encoder.decode(formatted);
            expect(generator.extractType(parsed)).toBe(0xFFF as IdType);
        });

        it('should throw on invalid formatted ID', () => {
            expect(() => encoder.decode('abc')).toThrow();
            expect(() => encoder.decode('x'.repeat(24))).toThrow();
            expect(() => encoder.decode('invalid_chars_here!!!!!!')).toThrow();
        });
    });

    describe('Alphabet Variations', () => {
        it('should work with base-36', () => {
            const base36 = '0123456789abcdefghijklmnopqrstuvwxyz';
            const fmt = new ObfusicatedIdEncoder(secretKey, base36);
            const id = generator.generate(IdType.USER);
            const formatted = fmt.encode(id);
            expect(formatted.length).toBe(25);
            expect(fmt.decode(formatted)).toEqual(id);
        });

        it('should work with base-57', () => {
            const base57 = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTU';
            const fmt = new ObfusicatedIdEncoder(secretKey, base57);
            const id = generator.generate(IdType.USER);
            const formatted = fmt.encode(id);
            expect(formatted.length).toBe(22);
            expect(fmt.decode(formatted)).toEqual(id);
        });

        it('should work with base-62', () => {
            const base62 = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
            const fmt = new ObfusicatedIdEncoder(secretKey, base62);
            const id = generator.generate(IdType.USER);
            const formatted = fmt.encode(id);
            expect(formatted.length).toBe(22);
            expect(fmt.decode(formatted)).toEqual(id);
        });
    });

    describe('Secret Key', () => {
        it('should depend on secret key', () => {
            const key1 = randomBytes(16);
            const key2 = randomBytes(16);
            const fmt1 = new ObfusicatedIdEncoder(key1, alphabet);
            const fmt2 = new ObfusicatedIdEncoder(key2, alphabet);

            const id = generator.generate(IdType.POST);
            const formatted1 = fmt1.encode(id);
            const formatted2 = fmt2.encode(id);
            expect(formatted1).not.toBe(formatted2);

            const parsedWrong = fmt2.decode(formatted1);
            expect(parsedWrong).not.toEqual(id);
        });
    });

    describe('Timestamp Accuracy', () => {
        it('should extract timestamps close to current time', () => {
            const now = BigInt(Date.now()) * 1_000_000n;
            const id = generator.generate(IdType.USER);
            const extracted = generator.extractTimeNs(id);
            const diff = extracted > now ? extracted - now : now - extracted;
            expect(Number(diff)).toBeLessThan(1_000_000_000); // Within 1s
        });
    });

    // Uncomment for stress test (runs longer)

    // it('should handle high volume with no collisions', async () => {
    //     const ids = new Set<string>();
    //     const iterations = 1_000_000;
    //     console.time('high volume test');
    //     for (let i = 0; i < iterations; i++) {
    //         const id = generator.generate(IdType.POST);
    //         ids.add(formatter.format(id));
    //     }
    //     console.timeEnd('high volume test');
    //     expect(ids.size).toBe(iterations);
    // }, 30_000);

});
