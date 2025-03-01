#!bun test
import {test, expect, describe, it} from 'bun:test'
import {randomBytes, randomInt} from 'node:crypto'
import {TypedIdGenerator} from './idgen'
import {IdFormatter} from './idfmt'

const enum IdType {
    USER,
    COMMENT,
    POST,
}

test('idgen', () => {
    const secretKey = randomBytes(16)
    const alphabet = 'pZ3VlgXskW2fLQSxCR5Mbm7cNdqGBrh8FD94TKzHJjv6w10tPn'

    const generator = new TypedIdGenerator<IdType>
    const formatter = new IdFormatter(secretKey,alphabet)

    const ids = new Set()
    expect(formatter.idLength).toBe(23)

    for(let i=0; i<10_000; ++i){
        const id = generator.generate(IdType.POST)
        expect(id.length).toBe(16)
        const formatted = formatter.format(id)
        expect(formatted.length).toBe(23)
        const back = formatter.parse(formatted)
        expect(back).toEqual(id)
        expect(ids.has(formatter)).toBeFalse()
        ids.add(formatted)
    }
})
