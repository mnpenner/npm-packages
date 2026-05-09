import { fileURLToPath } from 'node:url'
import { join } from 'node:path'

const distPath = fileURLToPath(new URL('../dist/', import.meta.url))
const index = Bun.file(join(distPath, 'index.html'))

async function fileForPath(pathname: string) {
    const requestedPath = pathname === '/' ? 'index.html' : pathname.slice(1)
    const file = Bun.file(join(distPath, requestedPath))

    if (await file.exists()) return file
    if (pathname.startsWith('/_bun/') || requestedPath.split('/').at(-1)?.includes('.'))
        return undefined

    return index
}

const server = Bun.serve({
    async fetch(request) {
        const url = new URL(request.url)
        const file = await fileForPath(url.pathname)

        if (!file) return new Response('Not found', { status: 404 })

        return new Response(file, {
            headers: {
                'Cache-Control': 'no-store',
            },
        })
    },
})

console.log(`Serving production build at ${server.url}`)
