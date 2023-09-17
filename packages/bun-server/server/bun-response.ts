import assert from 'assert'
import {Chunkable} from './server-api'
import {byteSize, NOOP, VoidFn} from './util'
import {Stream} from 'stream'
import {Deferred} from './promise'

// class BetterReadableStream<ChunkType=DefaultChunkType> extends ReadableStream {
//     closed = false
//     write!: (chunk: DefaultChunkType) => void
//     tryWrite!: (chunk: DefaultChunkType) => boolean
//     close!: VoidFn
//
//
//     constructor() {
//         super({
//             start(controller) {
//             }
//         }, {
//             highWaterMark: 14600
//         })
//     }
// }

class ReadWriteStream<Chunk extends Chunkable = Chunkable> {
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

enum StreamState {
    NOT_STARTED,
    STARTED,
    CLOSED,
}

export class HybridResponse {
    private _stream?: ReadWriteStream
    private _response?: Response
    private _bodyClosed = false
    private _headerDeferred = new Deferred()
    private _headers?: Headers
    private _status?: number

    get headersSent(): boolean {
        return this._headerDeferred.isSettled
    }

    get bodyClosed(): boolean {
        return this._bodyClosed
    }

    get bodyStarted(): boolean {
        return !!this._stream || !!this._response
    }

    write(chunk: Chunkable) {
        if(this._bodyClosed) {
            throw new Error("Response stream already closed")
        }
        this._stream ??= new ReadWriteStream()
        this._stream!.write(chunk)
    }

    tryWrite(chunk: Chunkable) {
        try {
            this.write(chunk)
            return true
        } catch {
            return false
        }
    }

    respond(res: Response): void
    respond(...args: ConstructorParameters<typeof Response>): void
    respond(res: any, ...args: any[]) {
        if(this._bodyClosed) {
            throw new Error("Response stream already closed")
        }
        if(this._stream) {
            throw new Error("Response stream already started")
        }
        this._bodyClosed = true
        if(!res) throw new Error("Missing response")
        if(res instanceof Response) {
            this._response = res
        } else {
            this._response = new Response(res, ...args)
        }
    }

    get headers(): Headers {
        this._headers ??= new Headers()
        return this._headers
    }

    setHeader(name: string, value: string) {
        assert(name?.length)
        if(this._headerDeferred.isSettled) {
            throw new Error("Headers already flushed")
        }
        this.headers.set(name, value)
        return this
    }

    setStatus(status: number) {
        assert(status >= 100 && status < 600)
        if(this._headerDeferred.isSettled) {
            throw new Error("Headers already flushed")
        }
        this._status = status
        return this
    }

    set status(status: number) {
        this.setStatus(status)
    }

    flushHeaders(headers?: HeadersInit) {
        if(this._headerDeferred.isSettled) {
            throw new Error("Headers already flushed")
        }
        if(headers) {
            if(this._headers?.count) {
                throw new Error("Headers already set")
            }
            this._headers = new Headers(headers)
        } else if(!this._headers) {
            this._headers = new Headers()
        }
        // Object.freeze(this._headers)
        this._headerDeferred.resolve()
    }

    end() {
        if(this._bodyClosed) return false
        if(this._headerDeferred.isPending) {
            this.flushHeaders()
        }
        this._stream?.close()
        this._bodyClosed = true
        return true
    }

    get status(): number {
        if(this._response) {
            return this._response.status
        }
        if(this._status != null) {
            return this._status
        }
        if(this._bodyClosed && !this._stream) {
            return 204
        }
        return 200
    }

    /**
     * Build a standard HTTP response.
     * Resolves as soon as the headers are ready.
     * The body may still be written to.
     */
    async buildResponse(): Promise<Response> {
        if(this._response) {
            return this._response
        }
        await this._headerDeferred.promise
        return new Response(this._stream?.stream, {
            status: this.status,
            headers: this.headers,
        })
    }
}

class BunResponse2 {
    status = 200
    headers = new Headers()
    headersSent = false
    bodySent = false
    write!: (chunk: Chunkable) => void
    tryWrite!: (chunk: Chunkable) => boolean
    close!: VoidFn
    body: ReadableStream

    constructor() {
        const self = this
        this.body = new ReadableStream({
            start(controller) {
                self.write = (chunk: Chunkable) => {
                    if(self.bodySent) throw new Error("Response stream already closed")
                    controller.enqueue(chunk)
                }
                self.tryWrite = (chunk: Chunkable) => {
                    if(self.bodySent) return false
                    controller.enqueue(chunk)
                    return true
                }
                self.close = () => {
                    if(self.bodySent) return false
                    controller.close()
                    return true
                }
            }
        })
    }


    setStatus(status: number) {
        assert(status >= 100 && status < 600)
        this.status = status
        return this
    }
}
