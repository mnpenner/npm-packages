import {ServeOptions, Server} from 'bun'
import {Router} from './router'
import {performance} from 'perf_hooks'
import Chalk from 'chalk'
import {formatContentType, formatDuration, formatSize, formatStatus} from './formatters'
import {PartialRecord} from './util'
import {BunUrl, Handler} from './server-api'
import {BunRequest} from './bun-request'
import {HybridResponse} from './hybrid-response'


export type SimpleServeOptions = Omit<ServeOptions,'fetch'> & {
    router: Router
    timeout?: number
    log?: boolean
    listen?: (server: Server) => void
}

declare global {  /* eslint-disable no-var */
    var requestId: number
}  /* eslint-enable */

globalThis.requestId ??= 0


export function serve({timeout,router,log,listen,...options}: SimpleServeOptions) {
    const server = Bun.serve({
        error(error) {
            console.log('error', error)
            if(error.code === 'ENOENT') {
                return new Response("Not Found", {status: 404})
            }
            throw error
        },
        ...options,
        async fetch(req) {
            const startTime = performance.now()
            const reqId = ++globalThis.requestId
            const url = new URL(req.url)
            const path = url.pathname + url.search + url.hash
            // let timeout: Timer|undefined;
            if(log) console.log(Chalk.grey(`>${reqId}`)+` ${Chalk.whiteBright.bold(req.method)} ${path} | ${formatSize(req.headers.get('Content-Length'))} | ${formatContentType(req.headers.get('Content-Type'))}`)

            const res = await (async () => {
                const result = router.match(path)


                if(!result) {
                    return new Response("Not Found", {status: 404})
                }



                const method = req.method.toLowerCase()
                const handler = (result.route.handlers as unknown as PartialRecord<Handler>)[method]

                if(handler) {
                    const bunUrl: BunUrl = Object.assign(url, {
                        params: result.match.params,
                        path: path,
                    })
                    const bunReq = new BunRequest(req, bunUrl)
                    const bunRes = new HybridResponse()
                    handler(bunReq, bunRes)

                    const timer = timeout ? setTimeout(() => {
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
                    }, timeout) : undefined


                    let headerTime = 0
                    bunRes.headerPromise.then(() => {
                        headerTime =  performance.now() - startTime
                    })
                    bunRes.bodyPromise.then(() => {
                        clearTimeout(timer)
                        const bodyTime = performance.now() - startTime
                        const bodyExtra = bodyTime - headerTime
                        if(log) console.log(Chalk.grey(`<${reqId}`)+` ${formatStatus(bunRes.status)} | ${formatSize(bunRes.headers.get('content-length'))} | ${formatContentType(bunRes.headers.get('content-type'))} | ${formatDuration(headerTime)}+${formatDuration(bodyExtra)}`)
                    })

                    return bunRes.buildResponse()
                }

                return new Response("Method Not Allowed", {status: 405})
            })()

            // clearTimeout(timeout)

            // const elapsed = performance.now() - timer
            // const contentLength = res.headers.get('Content-Length')
            // const contentType = res.headers.get('Content-Type')
            // console.log(Chalk.grey(`<${reqId}`)+` ${formatStatus(res.status)} | ${formatSize(contentLength)} | ${formatContentType(contentType)} | ${formatDuration(elapsed)}`)

            // console.log("return from serve")
            return res
        }
    })

    if(listen) {
        listen(server)
    } else if(log) {
        console.log(`Listening on ${server.hostname}:${server.port} (http://localhost:${server.port})`)
    }
}
