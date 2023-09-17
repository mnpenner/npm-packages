import * as Path from 'node:path'
import routes from './routes'
import {PartialRecord, mapDefined, nil, NOOP} from './util'
import assert from 'assert'
import {
    BunRequestInterface,
    BunResponseInterface,
    BunUrl,
    Chunkable,
    Handler,
    HttpRequestMethod,
    ReadableHTTPResponseSinkController,
    Route
} from './server-api'
import {UriMatch} from '@mpen/rerouter'
import {performance} from 'perf_hooks'
import Chalk from 'chalk'
import {humanFileSize} from './file-size'
import {Deferred} from './promise'
import {HybridResponse} from './bun-response'

declare global {  /* eslint-disable no-var */
    var requestId: number
}  /* eslint-enable */

globalThis.requestId ??= 0

const ROOT_DIR = `${import.meta.dir}/..`

const TIMEOUT = 1000

const numberFormatter = Intl.NumberFormat(undefined, {maximumFractionDigits: 2})

const server = Bun.serve({
    port: 8080,
    hostname: '::',
    development: true,
    async fetch(req) {
        const timer = performance.now()
        const reqId = ++globalThis.requestId
        const url = new URL(req.url)
        const path = url.pathname + url.search + url.hash
        // let timeout: Timer|undefined;
        console.log(Chalk.grey(`>${reqId}`)+` ${Chalk.whiteBright.bold(req.method)} ${path} | ${formatSize(req.headers.get('Content-Length'))} | ${formatContentType(req.headers.get('Content-Type'))}`)

        const res = await (async () => {
            let bestRoute: Route | undefined
            let maxScore = Number.NEGATIVE_INFINITY
            let bestMatch: UriMatch | null = null

            for(const [routeName, route] of Object.entries(routes)) {
                const match = route.template.match(path)
                if(match) {
                    if(match.score > maxScore) {
                        maxScore = match.score
                        bestRoute = route
                        bestMatch = match
                    }
                }
            }


            if(!bestRoute || !bestMatch) {
                return new Response("Not Found", {status: 404})
            }

            const method = req.method.toLowerCase()
            const contentType = req.headers.get('Content-Type')?.toLowerCase()

            const ws = new WritableStream<string | ArrayBuffer>()
            const writer = ws.getWriter()


            const bunUrl: BunUrl = Object.assign(url, {
                params: bestMatch.params,
                path: path,
            })
            // const eurl: BunUrl = url
            // eurl.params = bestMatch.params
            // eurl.path = path
            // req.parsedUrl = url






            const handler = (bestRoute as unknown as PartialRecord<Handler>)[method]

            if(handler) {
                const bunReq: BunRequestInterface = {
                    headers: req.headers,
                    method: req.method as HttpRequestMethod,
                    url: bunUrl,
                    body: {
                        stream() {
                            return req.body
                        },
                        text() {
                            return req.text()
                        },
                        json() {
                            return req.json()
                        },
                        blob() {
                            return req.blob()
                        },
                        buffer() {
                            return req.arrayBuffer()
                        },
                        async infer() {
                            // TODO: use contentType to parse body
                        },
                        used: req.bodyUsed,
                    },
                }
                const bunRes = new HybridResponse()
                handler(bunReq, bunRes)

                const timeout = setTimeout(() => {
                    if(bunRes.bodyClosed) {
                        return
                    }
                    // console.log('timeout')
                    if(!bunRes.headersSent) {
                        bunRes.status = 504
                    }

                    if(!bunRes.bodyStarted) {
                        // TODO: set based on Accept content-type?
                        bunRes.write("Timed out waiting to build server response")
                    }
                    // TODO: write something into response too if it's still empty...?

                    // bunRes.write("timeout!")
                    bunRes.end()
                }, TIMEOUT)

                const res = await bunRes.buildResponse()

                clearTimeout(timeout)

                return res
            }

            return new Response("Method Not Allowed", {status: 405})
        })()

        // clearTimeout(timeout)

        const elapsed = performance.now() - timer
        const contentLength = res.headers.get('Content-Length')
        const contentType = res.headers.get('Content-Type')
        console.log(Chalk.grey(`<${reqId}`)+` ${formatStatus(res.status)} | ${formatSize(contentLength)} | ${formatContentType(contentType)} | ${formatDuration(elapsed)}`)

        // console.log("return from serve")
        return res
    },
    error(error) {
        console.log('error', error)
        if(error.code === 'ENOENT') {
            return new Response("Not Found", {status: 404})
        }
        throw error
    },
})

function formatDuration(duration: number) {
    if(duration < 5) {
        return Chalk.green(duration.toFixed(2)+'ms')
    }
    if(duration < 100) {
        return Chalk.yellow(duration.toFixed(1)+'ms')
    }
    if(duration < 1000) {
        return Chalk.yellow(Math.round(duration)+'ms')
    }
    return Chalk.red(Intl.NumberFormat(undefined, {maximumFractionDigits: 2}).format(duration/1000)+'s')
}

function formatContentType(type: string|nil) {
    if(!type) return Chalk.grey('?')
    return Chalk.whiteBright(type)
}

function formatSize(size: string|number|nil) {
    if(!size) return Chalk.grey('?')
    const bytes = Number(size)
    if(!Number.isSafeInteger(bytes)) {
        return Chalk.grey(size)
    }
    const fmtSize = humanFileSize(bytes)
    if(bytes < 10*1024) {
        return Chalk.whiteBright(fmtSize)
    }
    if(bytes < 1*1024*1024) {
        return Chalk.yellowBright(fmtSize)
    }
    return Chalk.redBright(fmtSize)
}

function formatStatus(status: number|nil) {
    if(!status) return Chalk.red('?')
    if(status < 100) return Chalk.redBright(status)
    if(status < 200) return Chalk.blueBright(status)
    if(status < 300) return Chalk.greenBright(status)
    if(status < 400) return Chalk.cyanBright(status)
    if(status < 500) return Chalk.yellowBright(status)
    return Chalk.redBright(status)
}

console.log(`Listening on ${server.hostname}:${server.port} (http://localhost:${server.port})`)
