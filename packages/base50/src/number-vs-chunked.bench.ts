#!bun
import {run, bench, group, summary} from 'mitata'
import { randomBytes } from 'crypto'
import {ChunkedBufferEncoder} from './chunked-buffer-encoder'
import {NumberEncoder} from './number-encoder'
import {ASCII85_RFC1924} from './alphabets'

const lengths = [8,16,32,64,128,256,512,1024,4096]
const chunked = new ChunkedBufferEncoder(ASCII85_RFC1924,4,5)
const numeric = new NumberEncoder(ASCII85_RFC1924)

summary(() => {
    for(const len of lengths) {
        const buf = randomBytes(len)

        group(`len=${len}`, () => {
            bench('numeric', () => numeric.encodeBuf(buf))
            bench('chunked', () => chunked.encode(buf))
        })
    }
})

// Execute all groups/benches
await run()


// TL;DR NumberEncoder is faster than ChunkedBufferEncoder up to about length=300, then chunked is faster. 17x faster at 4 KiB.
