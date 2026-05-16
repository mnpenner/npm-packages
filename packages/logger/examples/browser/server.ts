#!/usr/bin/env -S bun -i
import { parseArgs, type ParseArgsConfig } from 'node:util'
import { fileURLToPath } from 'node:url'
import { $ } from 'bun'

const PARSE_CONFIG = {
    options: {
        host: {
            type: 'string',
            default: '127.0.0.1',
        },
        port: {
            type: 'string',
            default: '4173',
        },
    },
    strict: true,
    allowPositionals: false,
} satisfies ParseArgsConfig

const INDEX_PATH = fileURLToPath(new URL('./index.html', import.meta.url))
const MAIN_PATH = fileURLToPath(new URL('./main.js', import.meta.url))

async function main(options: Options): Promise<number | void> {
    const hostname = options.host
    const port = Number(options.port)

    if (!Number.isInteger(port) || port <= 0 || port > 65535) {
        console.error(`Invalid port: ${options.port}`)
        return 1
    }

    const server = Bun.serve({
        hostname,
        port,
        async fetch(request) {
            const url = new URL(request.url)

            if (url.pathname === '/' || url.pathname === '/index.html') {
                return new Response(Bun.file(INDEX_PATH), {
                    headers: { 'content-type': 'text/html; charset=utf-8' },
                })
            }

            if (url.pathname === '/browser-logger.js') {
                const build = await Bun.build({
                    entrypoints: [MAIN_PATH],
                    bundle: true,
                    format: 'esm',
                    sourcemap: 'inline',
                    target: 'browser',
                })

                if (!build.success) {
                    return new Response(
                        build.logs.map((log) => log.message).join('\n') || 'Build failed',
                        { status: 500, headers: { 'content-type': 'text/plain; charset=utf-8' } },
                    )
                }

                return new Response(build.outputs[0], {
                    headers: { 'content-type': 'text/javascript; charset=utf-8' },
                })
            }

            return new Response('Not found', { status: 404 })
        },
    })

    console.log(`BrowserLogger example: http://${server.hostname}:${server.port}/`)

    setInterval(() => {}, 60_000)
    await new Promise(() => {})
}

//#region Invoke main
type ParsedConfig = ReturnType<typeof parseArgs<typeof PARSE_CONFIG>>
type Options = ParsedConfig['values']

if (import.meta.main) {
    const { values } = parseArgs(PARSE_CONFIG)

    main(values).then(
        (exitCode) => {
            if (typeof exitCode === 'number') {
                process.exitCode = exitCode
            }
        },
        (err) => {
            if (err instanceof $.ShellError) {
                console.error(`Command failed with exit code ${err.exitCode}`)
                process.exitCode = err.exitCode
            } else {
                console.error(err ?? 'An unknown error occurred')
                process.exitCode = 1
            }
        },
    )
}
//#endregion
