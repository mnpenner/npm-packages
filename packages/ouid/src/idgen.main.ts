#!bun
import {randomBytes} from 'node:crypto'
import {OrderedTypedIdGenerator} from './OrderedTypedIdGenerator'
import {ObfusicatedIdEncoder} from './ObfusicatedIdEncoder'
import {ReadableIdEncoder} from './ReadableIdEncoder'
import {toHex} from './buffer'

const enum IdType {
    USER,
    COMMENT,
    POST,
}

function shuffleArray<T>(a: T[]) {
    var x, t, r = new Uint32Array(1)
    for(var i = 0, c = a.length - 1, m = a.length; i < c; i++, m--) {
        crypto.getRandomValues(r)
        x = Math.floor(r / 65536 / 65536 * m) + i
        t = a [i], a [i] = a [x], a [x] = t
    }

    return a
}

function shuffleString(s: string) {
    return shuffleArray(Array.from(s)).join('')
}

const secretKey = randomBytes(16)
const alphabet = shuffleString('0123456789bcdfghjklmnpqrstvwxzBCDFGHJKLMNPQRSTVWXZ')
// const alphabet = shuffleString('123456789bcdfghijklmnopqrstuvwxyzBCDFGHIJKLMNOPQRSTUVWXYZ')

console.log(`secretKey: ${toHex(secretKey)}`)
console.log(`alphabet: ${alphabet}`)
console.log()

const ouidGenerator = new OrderedTypedIdGenerator<IdType>
const obsEncoder = new ObfusicatedIdEncoder(secretKey, alphabet)
const readableEncoder = new ReadableIdEncoder()

// const id = idgen.generate(IdType.POST)
//
// console.log(id,toHex(id))
//
// console.log(idgen.extractType(id))
// console.log(idgen.extractTimeNs(id))
// console.log(idgen.extractDate(id))
//
// const formatted = idfmt.format(id)
// console.log(idfmt.idLength)
// console.log(formatted)
// const parsed = idfmt.parse(formatted)
// console.log(parsed)
//
// assert.deepEqual(parsed,id)

for(let i = 0; i < 100; ++i) {
    const id = ouidGenerator.generate(IdType.COMMENT)
    console.log(obsEncoder.encode(id), readableEncoder.encode(id))
}
