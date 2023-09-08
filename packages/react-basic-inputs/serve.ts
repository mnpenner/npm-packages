import * as Path from 'node:path'

Bun.serve({
    port: 8080,
    hostname: '0.0.0.0',
    development: true,
    async fetch(req) {
        const url = new URL(req.url)
        if(url.pathname === '/') {
            return new Response(Bun.file("./index.html"))
        }
        const file = Bun.file(Path.join(__dirname, url.pathname))
        if(await file.exists()) {
            return new Response(file)
        }
        return new Response("Not Found", {status: 404})
    },
})
