import router from './routes'
import {PartialRecord} from './util'
import {BunRequestInterface, BunUrl, Handler, HttpRequestMethod, CompiledRoute} from './server-api'
import {UriMatch} from '@mpen/rerouter'
import {performance} from 'perf_hooks'
import Chalk from 'chalk'

import {HybridResponse} from './hybrid-response'
import {formatContentType, formatDuration, formatSize, formatStatus} from './formatters'
import {BunRequest} from './bun-request'

declare global {  /* eslint-disable no-var */
    var requestId: number
}  /* eslint-enable */

globalThis.requestId ??= 0

const ROOT_DIR = `${import.meta.dir}/..`

const TIMEOUT = 1000

const numberFormatter = Intl.NumberFormat(undefined, {maximumFractionDigits: 2})

const server = Bun.serve({
    port: 3000,
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


                let headerTime = 0
                bunRes.headerPromise.then(() => {
                    headerTime =  performance.now() - timer
                })
                bunRes.bodyPromise.then(() => {
                    clearTimeout(timeout)
                    const bodyTime = performance.now() - timer
                    const bodyExtra = bodyTime - headerTime
                    console.log(Chalk.grey(`<${reqId}`)+` ${formatStatus(bunRes.status)} | ${formatSize(bunRes.headers.get('content-length'))} | ${formatContentType(bunRes.headers.get('content-type'))} | ${formatDuration(headerTime)}+${formatDuration(bodyExtra)}`)
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
    },
    error(error) {
        console.log('error', error)
        if(error.code === 'ENOENT') {
            return new Response("Not Found", {status: 404})
        }
        throw error
    },
})

console.log(`Listening on ${server.hostname}:${server.port} (http://localhost:${server.port})`)
