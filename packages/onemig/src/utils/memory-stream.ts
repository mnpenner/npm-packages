import {Writable} from 'stream'

export default class MemoryStream extends Writable {
    private buf: Buffer[] = []

    toString(encoding?: BufferEncoding) {
        return Buffer.concat(this.buf).toString(encoding)
    }

    getSize(): number {
        return this.buf.reduce((prev, cur) => prev + cur.length, 0)
    }

    _write(chunk: Buffer, encoding: BufferEncoding, callback: (error?: (Error | null)) => void) {
        this.buf.push(chunk)
        callback()
    }
}
