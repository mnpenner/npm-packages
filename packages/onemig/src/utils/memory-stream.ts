import {Writable} from 'stream'

export default class MemoryStream extends Writable {
    private chunks: Buffer[] = []

    toString(encoding?: BufferEncoding) {
        return Buffer.concat(this.chunks).toString(encoding)
    }

    getSize(): number {
        return this.chunks.reduce((prev, cur) => prev + cur.length, 0)
    }

    _write(chunk: Buffer, encoding: BufferEncoding, callback: (error?: (Error | null)) => void) {
        this.chunks.push(chunk)
        callback()
    }
}
