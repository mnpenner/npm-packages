import * as Path from 'node:path'

declare global {  /* eslint-disable no-var */
    var requestId: number
}  /* eslint-enable */

globalThis.requestId ??= 0

const ROOT_DIR = `${import.meta.dir}/..`

const server = Bun.serve({
    port: 8080,
    hostname: '::',
    development: true,
    async fetch(req) {
        const url = new URL(req.url)
        const reqId = ++globalThis.requestId
        console.log(`>${reqId} ${url.pathname}`)
        const res = await (async () => {
            if(url.pathname === '/') {
                return new Response(Bun.file("./index.html"))
            }
            return new Response(Bun.file(Path.join(ROOT_DIR, url.pathname)))
        })()
        queueMicrotask(() => {
            // FIXME: this might still error and return something different...
            console.log(`<${reqId} ${res.status} | ${res.headers.get('Content-Length') ?? '?'} B`)
        })
        return res
    },
    error(error) {
        if(error.code === 'ENOENT') {
            return new Response("Not Found", {status: 404})
        }
        throw error;
    },
})

function getHostname(hostname: string) {
    switch(hostname) {
        case '0.0.0.0':
            // return '127.0.0.1'
        case '::':
        case '0:0:0:0:0:0:0:0':
            // return '[::1]'
            return 'localhost'
    }
    return hostname
}

console.log(`Listening on ${server.hostname}:${server.port} (http://${getHostname(server.hostname)}:${server.port})`)
