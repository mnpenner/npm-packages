#!/usr/bin/env -S bun

import router from './router'
import { PORT } from './env.ts'

const server = Bun.serve({ port: PORT, fetch: router.fetch.bind(router) })
console.log(`routekit running at http://localhost:${server.port}`)
