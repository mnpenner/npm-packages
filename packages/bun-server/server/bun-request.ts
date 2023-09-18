import {HttpRequestMethod} from './server-api'
import {UriParams} from '@mpen/rerouter'



interface BunUrl<P extends UriParams> extends URL {
    params: P
    path: string
}

class BunBody {

    constructor(private readonly req: Request) {

    }

    stream() {
        return this.req.body
    }

    text() {
        return this.req.text()
    }

    json() {
        return this.req.json()
    }

    blob() {
        return this.req.blob()
    }

    buffer() {
        return this.req.arrayBuffer()
    }

    async infer() {
        // TODO: use contentType to parse body
    }

    get used() {
        return this.req.bodyUsed
    }
}

export class BunRequest<P extends UriParams> {
    headers: Headers
    method: HttpRequestMethod
    url: BunUrl<P>
    body: BunBody

    constructor(req: Request, url: BunUrl<P>) {
        this.headers = req.headers
        this.method = req.method as HttpRequestMethod
        this.url = url
        this.body = new BunBody(req)
    }
}
