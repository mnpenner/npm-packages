import {Chunkable} from './server-api'
import {byteSize, VoidFn} from './util'

export class ReadWriteStream<Chunk extends Chunkable = Chunkable> {
    // controller!: ReadableStreamController<R>
    stream: ReadableStream<Chunk>
    closed = false

    write!: (chunk: Chunk) => void
    // tryWrite!: (chunk: Chunk) => boolean
    close!: VoidFn

    constructor() {
        const self = this
        this.stream = new ReadableStream<Chunk>({
            start(controller) {
                self.write = chunk => {
                    if(self.closed) throw new Error("Response stream already closed")
                    controller.enqueue(chunk)
                }
                // self.tryWrite = chunk => {
                //     if(self.closed) return false
                //     controller.enqueue(chunk)
                //     return true
                // }
                self.close = () => {
                    if(self.closed) return false
                    self.closed = true
                    controller.close()
                    return true
                }
            }
        }, {
            highWaterMark: 14_600 - 4 * 1024,
            size(chunk) {
                if(!chunk) return 0
                if(typeof chunk === 'string') {
                    return byteSize(chunk)
                }
                // if(Buffer.isBuffer(chunk) || chunk instanceof ArrayBuffer) {
                //     return chunk.byteLength
                // }
                // if(chunk instanceof ArrayBuffer) {
                //     return chunk.byteLength
                // }
                return chunk.byteLength ?? (chunk as any).size ?? (chunk as any).length ?? 1
            }
        })

    }
}
