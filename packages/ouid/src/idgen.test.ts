#!bun
import {randomBytes} from 'node:crypto'
import assert from 'node:assert/strict'
import {TypedIdGenerator} from './idgen'
import {IdFormatter} from './idfmt'

function toHex(array: Uint8Array): string {
    return Array.from(array)
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join('')
}

const enum IdType {
    USER,
    COMMENT,
    POST,
}


const idgen = new TypedIdGenerator<IdType>
const idfmt = new IdFormatter(randomBytes(16))

const id = idgen.generate(IdType.POST)

console.log(id,toHex(id))

console.log(idgen.extractType(id))
console.log(idgen.extractTimeNs(id))
console.log(idgen.extractDate(id))

const formatted = idfmt.format(id)
console.log(formatted)
const parsed = idfmt.parse(formatted)
console.log(parsed)

assert.deepEqual(parsed,id)

