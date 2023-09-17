import * as Path from 'node:path'
import routes from './routes'
import {PartialRecord, mapDefined, nil, NOOP} from './util'
import assert from 'assert'
import {
    BunRequest,
    BunResponse,
    BunUrl,
    ChunkType,
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
            const bunReq: BunRequest = {
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


            // https://stackoverflow.com/questions/77117179/how-do-i-pipe-a-writablestream-to-a-readablestream

            let resHeaders: HeadersInit|undefined
            let fullResponse: Response|undefined

            const headersSent = new Deferred<void>
            const bodySent = new Deferred<void>

            const bunRes: BunResponse = {
                status: 200,
                sendHeaders(headers: HeadersInit) {
                    resHeaders = headers
                    headersSent.resolve()
                },
                respond(res: any, ...args: any[]) {
                    this.close()
                    if(!args) throw new Error("Missing args")
                    if(res instanceof Response) {
                        fullResponse = res
                    } else {
                        fullResponse = new Response(res,...args)
                    }
                },
                write: NOOP,
                tryWrite: NOOP,
                error: NOOP,
                close: NOOP,
            }

            // console.log('hihihi2')
            const stream = new ReadableStream<ChunkType>({
                // FIXME: this is kind of broken: https://discord.com/channels/876711213126520882/1115490432219095081/1152756323964952576
                // type: 'direct' as any,
                start(controller) {
                    // console.log(controller)
                    // controller.enqueue("hello!!!")
                    // controller.close()


                    // FIXME: should be write. i don't want this to be buffered.
                    // bunRes.write = controller.enqueue.bind(controller)


                    bunRes.write = (chunk: ChunkType) => {
                        if(bodySent.isPending) {
                            controller.enqueue(chunk)
                        } else {
                            throw new Error("Body closed")
                        }
                    }

                    bunRes.tryWrite = (chunk: ChunkType) => {
                        if(bodySent.isPending) {
                            controller.enqueue(chunk)
                            return true
                        }
                        return false
                    }

                    bunRes.close = () => {
                        if(!bodySent.isPending) return false
                        controller.close()
                        headersSent.resolve()
                        bodySent.resolve()
                        return true
                    }

                    bunRes.error = (err: Error) => {
                        controller.error(err)
                        headersSent.reject(err)
                    }
                },
            })

            // console.log('b4')
            const timeout = setTimeout(() => {
                // console.log('timeout')
                if(headersSent.isPending) {
                    bunRes.status = 504
                }
                // TODO: write something into response too if it's still empty...?

                // bunRes.write("timeout!")
                bunRes.close()
            }, TIMEOUT)

            bodySent.promise.then(() => {
                clearTimeout(timeout)
            })

            const handler = (bestRoute as unknown as PartialRecord<Handler>)[method]

            if(handler) {
                handler(bunReq, bunRes)

                await headersSent.promise

                if(fullResponse) {
                    return fullResponse
                }

                const options: ResponseInit = Object.create(null)
                if(resHeaders) {
                    options.headers = resHeaders
                }
                if(bunRes.status) {
                    options.status = bunRes.status
                }
                return new Response(stream, options)
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
