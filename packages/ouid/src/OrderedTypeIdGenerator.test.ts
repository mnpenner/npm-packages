#!bun test
import {expect, describe, it} from 'bun:test'
import {OrderedTypedIdGenerator} from './OrderedTypedIdGenerator'
import {toHex} from './util'
import {randomInt} from 'crypto'

describe('OrderedTypedIdGenerator', () => {
    const generator = new OrderedTypedIdGenerator<number>()

    it.skipIf(!Bun.env.RUN_SLOW_TESTS)('should be ordered & unique', () => {
        let lastTime = -1n
        const idCount = 250_000;
        const idSet = new Set<string>();
        for(let i = 0; i < idCount; ++i) {
            const type = randomInt(0, 0x1000)
            const id = generator.generate(type)
            let time = generator.extractTimeNs(id)
            expect(time).toBeGreaterThan(lastTime)
            lastTime = time
            expect(generator.extractType(id)).toBe(type)
            idSet.add(toHex(id));
        }
        expect(idSet.size).toBe(idCount);
    })
})
