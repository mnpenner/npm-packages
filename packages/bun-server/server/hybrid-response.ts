import {ReadWriteStream} from './read-write-stream'
import {Deferred} from './promise'
import {Chunkable} from './server-api'
import assert from 'assert'

export class HybridResponse {
    private _stream?: ReadWriteStream
    private _response?: Response
    private _bodyDeferred = new Deferred()
    private _headerDeferred = new Deferred()
    private _headers?: Headers
    private _status?: number

    get headersSent(): boolean {
        return this._headerDeferred.isSettled
    }

    get bodyClosed(): boolean {
        return this._bodyDeferred.isSettled
    }

    get headerPromise() {
        return this._headerDeferred.promise
    }

    get bodyPromise() {
        return this._bodyDeferred.promise
    }

    get bodyStarted(): boolean {
        return !!this._stream || !!this._response
    }

    write(chunk: Chunkable) {
        if(this.bodyClosed) {
            throw new Error("Response stream already closed")
        }
        this._stream ??= new ReadWriteStream()
        this._stream!.write(chunk)
        return this
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
        if(this.bodyClosed) {
            throw new Error("Response stream already closed")
        }
        if(this._stream) {
            throw new Error("Response stream already started")
        }
        if(!res) {
            throw new Error("Missing response")
        }
        if(res instanceof Response) {
            this._response = res
        } else {
            this._response = new Response(res, ...args)
        }
        this._headerDeferred.resolve()
        this._bodyDeferred.resolve()
    }

    file(path: string | URL, options?: BlobPropertyBag) {
        return this.respond(Bun.file(path, options))
    }

    json(body?: any, options?: ResponseInit | number) {
        return this.respond(Response.json(body, options))
    }

    get headers(): Headers {
        if(this._response) {
            return this._response.headers
        }
        this._headers ??= new Headers()
        return this._headers
    }

    setHeader(name: string, value: string | number) {
        assert(name?.length)
        if(this.headersSent) {
            throw new Error("Headers already flushed")
        }
        if(typeof value === 'number') {
            if(!Number.isSafeInteger(value)) {
                throw new Error("Unsafe number")
            }
            value = String(value)
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
        return this
    }

    end() {
        if(this.bodyClosed) return false
        if(this._headerDeferred.isPending) {
            this.flushHeaders()
        }
        this._stream?.close()
        this._bodyDeferred.resolve()
        return true
    }

    get status(): number {
        if(this._response) {
            return this._response.status
        }
        if(this._status != null) {
            return this._status
        }
        if(this.bodyClosed && !this._stream) {
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
