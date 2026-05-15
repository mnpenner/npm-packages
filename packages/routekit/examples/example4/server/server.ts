#!/usr/bin/env -S bun

import router from './router'

const server = Bun.serve({ port: 0, fetch: router.fetch.bind(router) })
console.log(`routekit running at http://localhost:${server.port}`)
